import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get comments for a novel or chapter
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const novelId = searchParams.get("novelId")
        const chapterId = searchParams.get("chapterId")

        if (!novelId && !chapterId) {
            return NextResponse.json({ error: "novelId or chapterId required" }, { status: 400 })
        }

        const comments = await prisma.comment.findMany({
            where: {
                ...(chapterId ? { chapterId } : { novelId }),
                parentId: null, // Only top-level comments
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                user: {
                    select: { id: true, name: true, image: true },
                },
                replies: {
                    include: {
                        user: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        const totalCount = await prisma.comment.count({
            where: chapterId ? { chapterId } : { novelId: novelId! },
        })

        return NextResponse.json({ comments, totalCount })
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
        const { novelId, chapterId, content, parentId } = body

        if ((!novelId && !chapterId) || !content) {
            return NextResponse.json({ error: "Content and novelId/chapterId required" }, { status: 400 })
        }

        if (content.length > 1000) {
            return NextResponse.json({ error: "Comment too long (max 1000 characters)" }, { status: 400 })
        }

        const comment = await prisma.comment.create({
            data: {
                novelId: novelId || null,
                chapterId: chapterId || null,
                userId: session.user.id,
                content: content.trim(),
                parentId: parentId || null,
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true },
                },
            },
        })

        return NextResponse.json(comment, { status: 201 })
    } catch (error) {
        console.error("Error creating comment:", error)
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }
}
