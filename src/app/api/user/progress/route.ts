import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Update reading progress
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { chapterId, progress } = body

        if (!chapterId || progress === undefined) {
            return NextResponse.json(
                { error: "chapterId and progress are required" },
                { status: 400 }
            )
        }

        // Validate progress (0-100)
        const validProgress = Math.min(100, Math.max(0, Math.round(progress)))

        // Check if already completed
        const existing = await prisma.readingHistory.findUnique({
            where: {
                userId_chapterId: {
                    userId: session.user.id,
                    chapterId: chapterId,
                },
            },
        })

        // Mark as completed if progress >= 70% and not already completed
        const shouldMarkComplete = validProgress >= 70 && !existing?.completedAt

        // Upsert reading history
        const history = await prisma.readingHistory.upsert({
            where: {
                userId_chapterId: {
                    userId: session.user.id,
                    chapterId: chapterId,
                },
            },
            update: {
                progress: validProgress,
                readAt: new Date(),
                ...(shouldMarkComplete && { completedAt: new Date() }),
            },
            create: {
                userId: session.user.id,
                chapterId: chapterId,
                progress: validProgress,
                ...(validProgress >= 70 && { completedAt: new Date() }),
            },
        })

        return NextResponse.json({
            success: true,
            progress: history.progress,
            completed: !!history.completedAt,
        })
    } catch (error) {
        console.error("Error saving reading progress:", error)
        return NextResponse.json(
            { error: "Failed to save progress" },
            { status: 500 }
        )
    }
}
