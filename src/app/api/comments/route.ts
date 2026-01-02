import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get comments for a novel
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const novelId = searchParams.get("novelId")

        if (!novelId) {
            return NextResponse.json({ error: "Novel ID required" }, { status: 400 })
        }

        const comments = await prisma.comment.findMany({
            where: { novelId },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                user: {
                    select: { name: true, image: true },
                },
            },
        })

        return NextResponse.json(comments)
    } catch (error) {
        console.error("Error fetching comments:", error)
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }
}

// POST - Create a comment
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { novelId, content, chapterId } = body

        if (!novelId || !content) {
            return NextResponse.json({ error: "Novel ID and content required" }, { status: 400 })
        }

        const comment = await prisma.comment.create({
            data: {
                novelId,
                chapterId: chapterId || null,
                userId: session.user.id,
                content,
            },
            include: {
                user: {
                    select: { name: true, image: true },
                },
            },
        })

        return NextResponse.json(comment, { status: 201 })
    } catch (error) {
        console.error("Error creating comment:", error)
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }
}
