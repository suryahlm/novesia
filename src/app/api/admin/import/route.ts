import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getJsonFromR2, getR2PublicUrl, r2Client } from "@/lib/r2"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"

// Types for R2 novel data
interface R2Chapter {
    id?: string
    number: number
    title: string
    originalTitle?: string
    content: string
}

interface ScannedNovel {
    id: number
    folderPath: string
    totalChapters: number
}

// Helper to verify admin
async function verifyAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    return user?.role === "ADMIN"
}

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "novesia-assets"

// Scan R2 for novel folders
async function scanR2Novels(): Promise<ScannedNovel[]> {
    const novels: ScannedNovel[] = []

    try {
        // List all prefixes under novels/
        const command = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: "novels/",
            Delimiter: "/",
        })

        const response = await r2Client.send(command)

        if (!response.CommonPrefixes) {
            return novels
        }

        // For each novel folder, count chapters
        for (const prefix of response.CommonPrefixes) {
            if (!prefix.Prefix) continue

            // Extract novel ID from path (e.g., "novels/3564/" -> 3564)
            const match = prefix.Prefix.match(/novels\/(\d+)\//)
            if (!match) continue

            const novelId = parseInt(match[1])

            // Count chapters in this folder
            const chaptersCommand = new ListObjectsV2Command({
                Bucket: R2_BUCKET_NAME,
                Prefix: prefix.Prefix,
                MaxKeys: 1000,
            })

            const chaptersResponse = await r2Client.send(chaptersCommand)
            const chapterCount = chaptersResponse.Contents?.filter(
                obj => obj.Key?.includes("chapter-")
            ).length || 0

            novels.push({
                id: novelId,
                folderPath: prefix.Prefix,
                totalChapters: chapterCount,
            })
        }
    } catch (error) {
        console.error("Error scanning R2:", error)
    }

    return novels
}

// GET - List novels available in R2
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Scan R2 for novel folders
        const scannedNovels = await scanR2Novels()

        if (scannedNovels.length === 0) {
            return NextResponse.json({
                error: "Tidak ada novel di R2 (folder novels/[id]/)",
                novels: []
            }, { status: 200 })
        }

        // Get first chapter of each novel to extract metadata
        const novelsWithMeta = await Promise.all(
            scannedNovels.map(async (novel) => {
                const chapterData = await getJsonFromR2<R2Chapter>(
                    `novels/${novel.id}/chapter-1.json`
                )

                // Generate slug from novel ID (or from title if available)
                const slug = `novel-${novel.id}`

                // Check if already imported
                const existing = await prisma.novel.findFirst({
                    where: {
                        OR: [
                            { slug },
                            { slug: { contains: String(novel.id) } }
                        ]
                    }
                })

                return {
                    id: novel.id,
                    title: chapterData?.originalTitle
                        ? `Novel ${novel.id}`
                        : `Novel ${novel.id}`,
                    slug,
                    coverUrl: getR2PublicUrl(`covers/${novel.id}.jpg`),
                    author: "Unknown",
                    synopsis: `Novel dengan ${novel.totalChapters} chapter dari R2 storage.`,
                    status: "ongoing",
                    genres: ["Fantasy"],
                    totalChapters: novel.totalChapters,
                    isImported: !!existing,
                    folderPath: novel.folderPath,
                }
            })
        )

        return NextResponse.json({
            novels: novelsWithMeta,
            total: novelsWithMeta.length,
            imported: novelsWithMeta.filter(n => n.isImported).length,
        })
    } catch (error) {
        console.error("Error fetching R2 novels:", error)
        return NextResponse.json({ error: "Gagal mengambil data dari R2" }, { status: 500 })
    }
}

// POST - Import novel from R2 to database
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { novelId, title, author, synopsis, genres } = await request.json()

        if (!novelId) {
            return NextResponse.json({ error: "Novel ID diperlukan" }, { status: 400 })
        }

        // Scan to get chapter count
        const scannedNovels = await scanR2Novels()
        const novelInfo = scannedNovels.find(n => n.id === novelId)

        if (!novelInfo) {
            return NextResponse.json({ error: "Novel tidak ditemukan di R2" }, { status: 404 })
        }

        const slug = `novel-${novelId}`

        // Check if already exists
        const existing = await prisma.novel.findUnique({
            where: { slug }
        })

        if (existing) {
            return NextResponse.json({ error: "Novel sudah ada di database" }, { status: 400 })
        }

        // Get or create genres
        const genreNames = genres || ["Fantasy"]
        const genreRecords = await Promise.all(
            genreNames.map(async (genreName: string) => {
                const genreSlug = genreName.toLowerCase().replace(/\s+/g, "-")
                return prisma.genre.upsert({
                    where: { slug: genreSlug },
                    update: {},
                    create: { name: genreName, slug: genreSlug }
                })
            })
        )

        // Get first chapter to extract title if not provided
        const firstChapter = await getJsonFromR2<R2Chapter>(`novels/${novelId}/chapter-1.json`)

        // Create novel
        const novel = await prisma.novel.create({
            data: {
                title: title || `Novel ${novelId}`,
                slug,
                synopsis: synopsis || `Novel dengan ${novelInfo.totalChapters} chapter dari R2 storage.`,
                cover: getR2PublicUrl(`covers/${novelId}.jpg`),
                author: author || "Unknown",
                status: "ONGOING",
                genres: {
                    connect: genreRecords.map(g => ({ id: g.id }))
                }
            }
        })

        // Import chapters
        let importedChapters = 0
        const errors: string[] = []

        for (let i = 1; i <= novelInfo.totalChapters; i++) {
            try {
                const chapterData = await getJsonFromR2<R2Chapter>(`novels/${novelId}/chapter-${i}.json`)

                if (chapterData) {
                    await prisma.chapter.create({
                        data: {
                            novelId: novel.id,
                            chapterNumber: chapterData.number || i,
                            title: chapterData.title || `Chapter ${i}`,
                            contentTranslated: chapterData.content,
                            isPremium: false,
                            coinCost: 0,
                        }
                    })
                    importedChapters++

                    // Log progress every 50 chapters
                    if (i % 50 === 0) {
                        console.log(`Imported ${i}/${novelInfo.totalChapters} chapters...`)
                    }
                }
            } catch (err) {
                errors.push(`Chapter ${i}: ${err instanceof Error ? err.message : "Error"}`)
            }
        }

        return NextResponse.json({
            success: true,
            novel: {
                id: novel.id,
                title: novel.title,
                slug: novel.slug,
            },
            chaptersImported: importedChapters,
            totalChapters: novelInfo.totalChapters,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        })
    } catch (error) {
        console.error("Error importing novel:", error)
        return NextResponse.json({
            error: `Gagal import novel: ${error instanceof Error ? error.message : "Unknown error"}`
        }, { status: 500 })
    }
}
