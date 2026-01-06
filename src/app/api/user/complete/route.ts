import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Mark chapter as completed (called when navigating to next chapter)
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { chapterId } = body

        if (!chapterId) {
            return NextResponse.json(
                { error: "chapterId is required" },
                { status: 400 }
            )
        }

        // Upsert reading history with completion
        const history = await prisma.readingHistory.upsert({
            where: {
                userId_chapterId: {
                    userId: session.user.id,
                    chapterId: chapterId,
                },
            },
            update: {
                completedAt: new Date(),
                readAt: new Date(),
            },
            create: {
                userId: session.user.id,
                chapterId: chapterId,
                progress: 100,
                completedAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            completed: !!history.completedAt,
        })
    } catch (error) {
        console.error("Error marking chapter complete:", error)
        return NextResponse.json(
            { error: "Failed to mark complete" },
            { status: 500 }
        )
    }
}
