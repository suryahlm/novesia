import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Create new chapter
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })
        if (user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { novelId, chapterNumber, title, content, isPremium, coinCost } = body

        if (!novelId || !chapterNumber || !title || !content) {
            return NextResponse.json(
                { error: "Novel ID, chapter number, title, and content are required" },
                { status: 400 }
            )
        }

        // Check if novel exists
        const novel = await prisma.novel.findUnique({
            where: { id: novelId },
        })
        if (!novel) {
            return NextResponse.json({ error: "Novel not found" }, { status: 404 })
        }

        // Check if chapter number already exists
        const existingChapter = await prisma.chapter.findFirst({
            where: { novelId, chapterNumber },
        })
        if (existingChapter) {
            return NextResponse.json(
                { error: `Chapter ${chapterNumber} already exists for this novel` },
                { status: 400 }
            )
        }

        // Calculate word count
        const wordCount = content.split(/\s+/).filter(Boolean).length

        // Create chapter
        const chapter = await prisma.chapter.create({
            data: {
                novelId,
                chapterNumber,
                title,
                contentTranslated: content,
                wordCount,
                isPremium: isPremium || false,
                coinCost: coinCost || 5,
            },
        })

        return NextResponse.json(chapter, { status: 201 })
    } catch (error) {
        console.error("Error creating chapter:", error)
        return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 })
    }
}
