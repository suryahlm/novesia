import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - List all forum posts with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const categoryId = searchParams.get("categoryId")
        const skip = (page - 1) * limit

        const where = categoryId ? { categoryId } : {}

        const [posts, total] = await Promise.all([
            prisma.forumPost.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, image: true, isVip: true },
                    },
                    category: {
                        select: { id: true, name: true, slug: true, icon: true },
                    },
                },
                orderBy: [
                    { isPinned: "desc" },
                    { createdAt: "desc" },
                ],
                skip,
                take: limit,
            }),
            prisma.forumPost.count({ where }),
        ])

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error("Error fetching forum posts:", error)
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }
}

// POST - Create new forum post
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { title, content, categoryId } = await request.json()

        if (!title?.trim() || !content?.trim() || !categoryId) {
            return NextResponse.json(
                { error: "Title, content, and category are required" },
                { status: 400 }
            )
        }

        const post = await prisma.forumPost.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                userId: session.user.id,
                categoryId,
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true },
                },
                category: true,
            },
        })

        return NextResponse.json(post, { status: 201 })
    } catch (error) {
        console.error("Error creating forum post:", error)
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }
}
