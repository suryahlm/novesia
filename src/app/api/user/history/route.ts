import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user's reading history with novel progress
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const novelSlug = searchParams.get("novelSlug")

        // If novelSlug is provided, return only the last read chapter for that novel
        if (novelSlug) {
            const novel = await prisma.novel.findUnique({
                where: { slug: novelSlug },
                select: { id: true },
            })

            if (!novel) {
                return NextResponse.json({ lastReadChapter: null })
            }

            // Get the most recent reading history for this novel
            const lastRead = await prisma.readingHistory.findFirst({
                where: {
                    userId: session.user.id,
                    chapter: { novelId: novel.id },
                },
                orderBy: { readAt: "desc" },
                include: {
                    chapter: {
                        select: { chapterNumber: true },
                    },
                },
            })

            return NextResponse.json({
                lastReadChapter: lastRead?.chapter.chapterNumber || null,
            })
        }

        // Otherwise, return full reading history
        const history = await prisma.readingHistory.findMany({
            where: { userId: session.user.id },
            orderBy: { readAt: "desc" },
            include: {
                chapter: {
                    select: {
                        id: true,
                        chapterNumber: true,
                        title: true,
                        novel: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                cover: true,
                                author: true,
                                _count: { select: { chapters: true } },
                            },
                        },
                    },
                },
            },
        })

        // Group by novel to get unique novels with their latest read chapter
        const novelMap = new Map<string, {
            novel: typeof history[0]["chapter"]["novel"]
            chapter: { id: string; chapterNumber: number; title: string }
            progress: number
            readAt: Date
            chaptersRead: number
            lastChapterNumber: number
        }>()

        // Count unique chapters read per novel
        const chaptersReadPerNovel = new Map<string, Set<number>>()

        for (const item of history) {
            const novelId = item.chapter.novel.id

            // Track unique chapters read
            if (!chaptersReadPerNovel.has(novelId)) {
                chaptersReadPerNovel.set(novelId, new Set())
            }
            chaptersReadPerNovel.get(novelId)!.add(item.chapter.chapterNumber)

            // Keep the most recent entry per novel
            if (!novelMap.has(novelId)) {
                novelMap.set(novelId, {
                    novel: item.chapter.novel,
                    chapter: {
                        id: item.chapter.id,
                        chapterNumber: item.chapter.chapterNumber,
                        title: item.chapter.title,
                    },
                    progress: item.progress,
                    readAt: item.readAt,
                    chaptersRead: 0,
                    lastChapterNumber: item.chapter.chapterNumber,
                })
            }
        }

        // Update chapters read count
        for (const [novelId, data] of novelMap) {
            data.chaptersRead = chaptersReadPerNovel.get(novelId)?.size || 0
        }

        // Convert to array, sorted by most recent
        const result = Array.from(novelMap.values())
            .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())
            .slice(0, 50)

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching reading history:", error)
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }
}
