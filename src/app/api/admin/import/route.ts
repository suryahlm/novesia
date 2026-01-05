import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getJsonFromR2, getR2PublicUrl } from "@/lib/r2"

// Types for R2 novel data
interface R2Novel {
    id: number
    title: string
    slug: string
    cover: string
    author: string
    synopsis: string
    status: string
    genres: string[]
    totalChapters: number
}

interface R2Chapter {
    number: number
    title: string
    content: string
}

interface R2NovelIndex {
    novels: R2Novel[]
}

// Helper to verify admin
async function verifyAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    return user?.role === "ADMIN"
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

        // Get novel index from R2
        const index = await getJsonFromR2<R2NovelIndex>("novels/index.json")

        if (!index) {
            return NextResponse.json({
                error: "Tidak dapat membaca novels/index.json dari R2",
                novels: []
            }, { status: 200 })
        }

        // Check which novels are already imported
        const existingNovels = await prisma.novel.findMany({
            where: {
                OR: index.novels.map(n => ({ slug: n.slug }))
            },
            select: { slug: true }
        })

        const existingSlugs = new Set(existingNovels.map(n => n.slug))

        const novelsWithStatus = index.novels.map(novel => ({
            ...novel,
            coverUrl: novel.cover.startsWith("http") ? novel.cover : getR2PublicUrl(novel.cover),
            isImported: existingSlugs.has(novel.slug)
        }))

        return NextResponse.json({
            novels: novelsWithStatus,
            total: novelsWithStatus.length,
            imported: novelsWithStatus.filter(n => n.isImported).length,
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

        const { novelId } = await request.json()

        if (!novelId) {
            return NextResponse.json({ error: "Novel ID diperlukan" }, { status: 400 })
        }

        // Get novel index
        const index = await getJsonFromR2<R2NovelIndex>("novels/index.json")
        if (!index) {
            return NextResponse.json({ error: "Tidak dapat membaca index" }, { status: 500 })
        }

        const novelData = index.novels.find(n => n.id === novelId)
        if (!novelData) {
            return NextResponse.json({ error: "Novel tidak ditemukan di R2" }, { status: 404 })
        }

        // Check if already exists
        const existing = await prisma.novel.findUnique({
            where: { slug: novelData.slug }
        })

        if (existing) {
            return NextResponse.json({ error: "Novel sudah ada di database" }, { status: 400 })
        }

        // Get or create genres
        const genreRecords = await Promise.all(
            novelData.genres.map(async (genreName) => {
                const slug = genreName.toLowerCase().replace(/\s+/g, "-")
                return prisma.genre.upsert({
                    where: { slug },
                    update: {},
                    create: { name: genreName, slug }
                })
            })
        )

        // Create novel
        const novel = await prisma.novel.create({
            data: {
                title: novelData.title,
                slug: novelData.slug,
                synopsis: novelData.synopsis,
                cover: novelData.cover.startsWith("http") ? novelData.cover : getR2PublicUrl(novelData.cover),
                author: novelData.author,
                status: novelData.status === "ongoing" ? "ONGOING" : "COMPLETED",
                genres: {
                    connect: genreRecords.map(g => ({ id: g.id }))
                }
            }
        })

        // Import chapters
        let importedChapters = 0
        const errors: string[] = []

        for (let i = 1; i <= novelData.totalChapters; i++) {
            try {
                const chapterData = await getJsonFromR2<R2Chapter>(`novels/${novelId}/chapter-${i}.json`)

                if (chapterData) {
                    await prisma.chapter.create({
                        data: {
                            novelId: novel.id,
                            chapterNumber: chapterData.number,
                            title: chapterData.title || `Chapter ${chapterData.number}`,
                            contentTranslated: chapterData.content,
                            isPremium: false,
                            coinCost: 0,
                        }
                    })
                    importedChapters++
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
            totalChapters: novelData.totalChapters,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        })
    } catch (error) {
        console.error("Error importing novel:", error)
        return NextResponse.json({
            error: `Gagal import novel: ${error instanceof Error ? error.message : "Unknown error"}`
        }, { status: 500 })
    }
}
