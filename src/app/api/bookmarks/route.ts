import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user's bookmarks
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const bookmarks = await prisma.bookmark.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
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
            },
        })

        return NextResponse.json(bookmarks)
    } catch (error) {
        console.error("Error fetching bookmarks:", error)
        return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 })
    }
}

// POST - Add bookmark
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { novelId } = body

        if (!novelId) {
            return NextResponse.json({ error: "Novel ID required" }, { status: 400 })
        }

        // Check if already bookmarked
        const existing = await prisma.bookmark.findFirst({
            where: { userId: session.user.id, novelId },
        })

        if (existing) {
            return NextResponse.json({ error: "Already bookmarked" }, { status: 400 })
        }

        const bookmark = await prisma.bookmark.create({
            data: {
                userId: session.user.id,
                novelId,
            },
        })

        return NextResponse.json(bookmark, { status: 201 })
    } catch (error) {
        console.error("Error adding bookmark:", error)
        return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 })
    }
}

// DELETE - Remove bookmark
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { novelId } = body

        if (!novelId) {
            return NextResponse.json({ error: "Novel ID required" }, { status: 400 })
        }

        await prisma.bookmark.deleteMany({
            where: { userId: session.user.id, novelId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error removing bookmark:", error)
        return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
    }
}
