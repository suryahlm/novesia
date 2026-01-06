import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ChevronLeft, ChevronRight, Settings, Home, BookOpen, List } from "lucide-react"
import SwipeWrapper from "@/components/reader/SwipeWrapper"

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

    // Increment view counts (chapter views + novel totalViews)
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
        <SwipeWrapper
            novelSlug={novel.slug}
            currentChapterId={chapter.id}
            prevChapter={prevChapter?.chapterNumber || null}
            nextChapter={nextChapter?.chapterNumber || null}
        >
            <div className="min-h-screen bg-[var(--bg-primary)]">
                {/* Top Navigation */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur border-b border-[var(--bg-tertiary)]">
                    <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href={`/novel/${novel.slug}`}
                                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{novel.title}</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Chapter {chapter.chapterNumber}: {chapter.title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/novel/${novel.slug}`}
                                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                title="Daftar Chapter"
                            >
                                <List className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="pt-14 pb-20">
                    <article className="max-w-3xl mx-auto px-4 py-8">
                        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center">
                            Chapter {chapter.chapterNumber}: {chapter.title}
                        </h1>

                        <div
                            className="prose prose-lg dark:prose-invert max-w-none leading-relaxed text-[var(--text-primary)]"
                            style={{ fontSize: '18px', lineHeight: '1.8' }}
                        >
                            {content.split('\n').map((paragraph, index) => (
                                paragraph.trim() && (
                                    <p key={index} className="mb-4">
                                        {paragraph}
                                    </p>
                                )
                            ))}
                        </div>

                        {!content && (
                            <div className="text-center py-12 text-[var(--text-muted)]">
                                <BookOpen className="w-12 h-12 mx-auto mb-4" />
                                <p>Konten chapter belum tersedia</p>
                            </div>
                        )}
                    </article>
                </main>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur border-t border-[var(--bg-tertiary)]">
                    <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                        {prevChapter ? (
                            <Link
                                href={`/novel/${novel.slug}/${prevChapter.chapterNumber}`}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="text-sm">Prev</span>
                            </Link>
                        ) : (
                            <div className="w-20" />
                        )}

                        <Link
                            href={`/novel/${novel.slug}`}
                            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                        >
                            <Home className="w-5 h-5" />
                        </Link>

                        {nextChapter ? (
                            <Link
                                href={`/novel/${novel.slug}/${nextChapter.chapterNumber}`}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white rounded-lg transition-colors"
                            >
                                <span className="text-sm">Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <div className="w-20" />
                        )}
                    </div>
                </nav>
            </div>
        </SwipeWrapper>
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
