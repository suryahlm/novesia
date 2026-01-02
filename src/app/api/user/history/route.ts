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
            orderBy: { updatedAt: "desc" },
            take: 50,
            include: {
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
                chapter: {
                    select: {
                        id: true,
                        chapterNumber: true,
                        title: true,
                    },
                },
            },
        })

        return NextResponse.json(history)
    } catch (error) {
        console.error("Error fetching reading history:", error)
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }
}
