import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Get single post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const post = await prisma.forumPost.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, image: true, isVip: true },
                },
                category: {
                    select: { id: true, name: true, slug: true, icon: true },
                },
            },
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        // Increment views
        await prisma.forumPost.update({
            where: { id },
            data: { views: { increment: 1 } },
        })

        return NextResponse.json(post)
    } catch (error) {
        console.error("Error fetching post:", error)
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
    }
}

// DELETE - Delete post (owner or admin)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        const post = await prisma.forumPost.findUnique({
            where: { id },
            select: { userId: true },
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        // Check if user is owner or admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })

        if (post.userId !== session.user.id && user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await prisma.forumPost.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting post:", error)
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
    }
}
