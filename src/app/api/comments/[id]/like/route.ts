import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Toggle like on a comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: commentId } = await params

        // For simplicity, just increment likes
        // In a full implementation, you'd track which users liked what
        const comment = await prisma.comment.update({
            where: { id: commentId },
            data: { likes: { increment: 1 } },
            select: { id: true, likes: true },
        })

        return NextResponse.json(comment)
    } catch (error) {
        console.error("Error liking comment:", error)
        return NextResponse.json({ error: "Failed to like comment" }, { status: 500 })
    }
}
