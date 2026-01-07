import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ChapterReaderClient from "@/components/reader/ChapterReaderClient"

interface PageProps {
    params: Promise<{ slug: string; chapter: string }>
}

async function getChapterData(slug: string, chapterNumber: number) {
    const novel = await prisma.novel.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            cover: true,
        },
    })

    if (!novel) return null

    const chapter = await prisma.chapter.findFirst({
        where: {
            novelId: novel.id,
            chapterNumber,
        },
    })

    if (!chapter) return null

    // Get prev and next chapters
    const [prevChapter, nextChapter] = await Promise.all([
        prisma.chapter.findFirst({
            where: {
                novelId: novel.id,
                chapterNumber: chapterNumber - 1,
            },
            select: { chapterNumber: true },
        }),
        prisma.chapter.findFirst({
            where: {
                novelId: novel.id,
                chapterNumber: chapterNumber + 1,
            },
            select: { chapterNumber: true },
        }),
    ])

    // Increment view counts
    await Promise.all([
        prisma.chapter.update({
            where: { id: chapter.id },
            data: { views: { increment: 1 } },
        }),
        prisma.novel.update({
            where: { id: novel.id },
            data: { totalViews: { increment: 1 } },
        }),
    ])

    return {
        novel,
        chapter,
        prevChapter,
        nextChapter,
    }
}

export default async function ChapterReaderPage({ params }: PageProps) {
    const { slug, chapter: chapterParam } = await params
    const chapterNumber = parseInt(chapterParam)

    if (isNaN(chapterNumber)) {
        notFound()
    }

    const data = await getChapterData(slug, chapterNumber)

    if (!data) {
        notFound()
    }

    const { novel, chapter, prevChapter, nextChapter } = data
    const content = chapter.contentTranslated || chapter.contentOriginal || ""

    return (
        <ChapterReaderClient
            novel={novel}
            chapter={{
                id: chapter.id,
                chapterNumber: chapter.chapterNumber,
                title: chapter.title,
                content,
            }}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
        />
    )
}

export async function generateMetadata({ params }: PageProps) {
    const { slug, chapter: chapterParam } = await params
    const chapterNumber = parseInt(chapterParam)

    if (isNaN(chapterNumber)) {
        return { title: "Chapter Not Found" }
    }

    const data = await getChapterData(slug, chapterNumber)

    if (!data) {
        return { title: "Chapter Not Found" }
    }

    return {
        title: `${data.novel.title} - Chapter ${data.chapter.chapterNumber}: ${data.chapter.title}`,
        description: `Baca ${data.novel.title} Chapter ${data.chapter.chapterNumber} di Novesia`,
    }
}
