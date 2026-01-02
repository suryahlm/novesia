import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user's reading history
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const history = await prisma.readingHistory.findMany({
            where: { userId: session.user.id },
            orderBy: { readAt: "desc" },
            take: 50,
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

        // Transform to include novel at top level for easier consumption
        const transformed = history.map(item => ({
            ...item,
            novel: item.chapter.novel,
            chapter: {
                id: item.chapter.id,
                chapterNumber: item.chapter.chapterNumber,
                title: item.chapter.title,
            },
        }))

        return NextResponse.json(transformed)
    } catch (error) {
        console.error("Error fetching reading history:", error)
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }
}
