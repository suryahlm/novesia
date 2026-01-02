import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const chapter = await prisma.chapter.findUnique({
            where: { id },
            include: {
                novel: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        cover: true,
                    },
                },
            },
        })

        if (!chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            )
        }

        // Get prev and next chapters
        const [prevChapter, nextChapter] = await Promise.all([
            prisma.chapter.findFirst({
                where: {
                    novelId: chapter.novelId,
                    chapterNumber: chapter.chapterNumber - 1,
                },
                select: {
                    id: true,
                    chapterNumber: true,
                    title: true,
                    isPremium: true,
                    coinCost: true,
                },
            }),
            prisma.chapter.findFirst({
                where: {
                    novelId: chapter.novelId,
                    chapterNumber: chapter.chapterNumber + 1,
                },
                select: {
                    id: true,
                    chapterNumber: true,
                    title: true,
                    isPremium: true,
                    coinCost: true,
                },
            }),
        ])

        // Increment view count
        await prisma.chapter.update({
            where: { id },
            data: { views: { increment: 1 } },
        })

        return NextResponse.json({
            id: chapter.id,
            novelId: chapter.novelId,
            novelTitle: chapter.novel.title,
            novelSlug: chapter.novel.slug,
            novelCover: chapter.novel.cover,
            number: chapter.chapterNumber,
            title: chapter.title,
            content: chapter.contentTranslated || chapter.contentOriginal,
            isPremium: chapter.isPremium,
            coinCost: chapter.coinCost,
            views: chapter.views,
            wordCount: chapter.wordCount,
            prevChapter: prevChapter ? {
                id: prevChapter.id,
                number: prevChapter.chapterNumber,
                title: prevChapter.title,
                isPremium: prevChapter.isPremium,
                coinCost: prevChapter.coinCost,
            } : null,
            nextChapter: nextChapter ? {
                id: nextChapter.id,
                number: nextChapter.chapterNumber,
                title: nextChapter.title,
                isPremium: nextChapter.isPremium,
                coinCost: nextChapter.coinCost,
            } : null,
        })
    } catch (error) {
        console.error("Error fetching chapter:", error)
        return NextResponse.json(
            { error: "Failed to fetch chapter" },
            { status: 500 }
        )
    }
}
