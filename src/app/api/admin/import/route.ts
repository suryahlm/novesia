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

        // Get metadata of each novel from metadata.json
        const novelsWithMeta = await Promise.all(
            scannedNovels.map(async (novel) => {
                // Try to read metadata.json first
                interface NovelMetadata {
                    id?: string
                    title?: string
                    author?: string
                    synopsis?: string
                    status?: string
                    genres?: string[]
                    cover?: string
                    totalChapters?: number
                }

                const metadata = await getJsonFromR2<NovelMetadata>(
                    `novels/${novel.id}/metadata.json`
                )

                // Fallback to chapter-1 if no metadata
                const chapterData = !metadata ? await getJsonFromR2<R2Chapter>(
                    `novels/${novel.id}/chapter-1.json`
                ) : null

                // Generate slug from title or ID
                const title = metadata?.title || `Novel ${novel.id}`
                const slug = title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "") || `novel-${novel.id}`

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
                    title: metadata?.title || `Novel ${novel.id}`,
                    slug,
                    coverUrl: metadata?.cover || getR2PublicUrl(`covers/${novel.id}.jpg`),
                    author: metadata?.author || "Unknown",
                    synopsis: metadata?.synopsis || "",
                    status: metadata?.status || "ongoing",
                    genres: metadata?.genres || ["Fantasy"],
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

        // Read metadata.json for full novel info
        interface NovelMetadata {
            id?: string
            title?: string
            author?: string
            synopsis?: string
            status?: string
            genres?: string[]
            cover?: string
        }
        const metadata = await getJsonFromR2<NovelMetadata>(`novels/${novelId}/metadata.json`)

        // Use provided values or fallback to metadata
        const novelTitle = title || metadata?.title || `Novel ${novelId}`
        const novelAuthor = author || metadata?.author || "Unknown"
        const novelSynopsis = synopsis || metadata?.synopsis || ""
        const novelStatus = metadata?.status?.toUpperCase() === "COMPLETED" ? "COMPLETED" : "ONGOING"
        const novelCover = metadata?.cover || getR2PublicUrl(`covers/${novelId}.jpg`)

        // Generate slug from title
        const slug = novelTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || `novel-${novelId}`

        // Check if already exists
        const existing = await prisma.novel.findUnique({
            where: { slug }
        })

        if (existing) {
            return NextResponse.json({ error: "Novel sudah ada di database" }, { status: 400 })
        }

        // Get or create genres - use metadata genres if available
        const genreNames = genres || metadata?.genres || ["Fantasy"]
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

        // Create novel with full metadata
        const novel = await prisma.novel.create({
            data: {
                title: novelTitle,
                slug,
                synopsis: novelSynopsis,
                cover: novelCover,
                author: novelAuthor,
                status: novelStatus,
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
                    // Check if title contains [Premium] and clean it
                    const rawTitle = chapterData.title || `Chapter ${i}`
                    const hasPremiumTag = rawTitle.includes("[Premium]")
                    const cleanTitle = rawTitle.replace(/\s*\[Premium\]/gi, "").trim()

                    await prisma.chapter.create({
                        data: {
                            novelId: novel.id,
                            chapterNumber: chapterData.number || i,
                            title: cleanTitle,
                            contentTranslated: chapterData.content,
                            isPremium: hasPremiumTag,
                            coinCost: hasPremiumTag ? 10 : 0,
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
