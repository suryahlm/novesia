import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Crown, List } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ slug: string }>
}

async function getNovelWithChapters(slug: string) {
    const novel = await prisma.novel.findUnique({
        where: { slug },
        include: {
            chapters: {
                orderBy: { chapterNumber: "asc" },
                select: {
                    id: true,
                    chapterNumber: true,
                    title: true,
                    isPremium: true,
                    coinCost: true,
                    createdAt: true,
                },
            },
        },
    })
    return novel
}

export default async function NovelChaptersPage({ params }: PageProps) {
    const { slug } = await params
    const novel = await getNovelWithChapters(slug)

    if (!novel) {
        notFound()
    }

    return (
        <div className="py-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/novel/${novel.slug}`}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{novel.title}</h1>
                    <p className="text-[var(--text-secondary)]">
                        {novel.chapters.length} Chapter
                    </p>
                </div>
            </div>

            {/* Chapter Number Buttons */}
            {novel.chapters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {novel.chapters.map((chapter) => (
                        <Link
                            key={chapter.id}
                            href={`/novel/${novel.slug}/${chapter.chapterNumber}`}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--bg-tertiary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors text-sm font-medium"
                            title={chapter.title}
                        >
                            {chapter.chapterNumber}
                        </Link>
                    ))}
                </div>
            )}

            {/* Chapter List */}
            <div className="card divide-y divide-[var(--bg-tertiary)]">
                {novel.chapters.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                        Belum ada chapter
                    </div>
                ) : (
                    novel.chapters.map((chapter) => (
                        <Link
                            key={chapter.id}
                            href={`/novel/${novel.slug}/${chapter.chapterNumber}`}
                            className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-12 text-sm text-[var(--text-muted)]">
                                    Ch. {chapter.chapterNumber}
                                </span>
                                <span className="font-medium">{chapter.title}</span>
                                {chapter.isPremium && (
                                    <span className="badge badge-premium text-xs">
                                        <Crown className="w-3 h-3 mr-0.5" />
                                        {chapter.coinCost}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-[var(--text-muted)]">
                                {new Date(chapter.createdAt).toLocaleDateString("id-ID")}
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
