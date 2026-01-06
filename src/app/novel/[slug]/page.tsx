import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import {
    Star,
    Eye,
    BookOpen,
    Clock,
    Crown,
    User,
    Calendar,
} from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { getProxiedImageUrl } from "@/lib/image-utils"
import NovelActions from "@/components/novel/NovelActions"
import CommentSection from "@/components/novel/CommentSection"
import NovelChapterSection from "@/components/novel/NovelChapterPreview"
import RatingSection from "@/components/novel/RatingSection"

// Disable caching - always fetch fresh data
export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ slug: string }>
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const novel = await prisma.novel.findUnique({
        where: { slug },
        select: {
            title: true,
            synopsis: true,
            cover: true,
            author: true,
            genres: { select: { name: true } },
            _count: { select: { chapters: true } },
        },
    })

    if (!novel) {
        return { title: "Novel tidak ditemukan - Novesia" }
    }

    const description = novel.synopsis.slice(0, 160) + (novel.synopsis.length > 160 ? "..." : "")
    const genres = novel.genres.map(g => g.name).join(", ")

    return {
        title: `${novel.title} - Baca Novel di Novesia`,
        description: description,
        keywords: [novel.title, novel.author || "", genres, "novel", "web novel", "baca novel"].filter(Boolean),
        authors: novel.author ? [{ name: novel.author }] : undefined,
        openGraph: {
            title: novel.title,
            description: description,
            type: "book",
            images: novel.cover ? [{ url: novel.cover, width: 400, height: 600 }] : undefined,
            siteName: "Novesia",
        },
        twitter: {
            card: "summary_large_image",
            title: novel.title,
            description: description,
            images: novel.cover ? [novel.cover] : undefined,
        },
    }
}

async function getNovel(slug: string) {
    const novel = await prisma.novel.findUnique({
        where: { slug },
        include: {
            genres: true,
            chapters: {
                orderBy: { chapterNumber: "desc" },
                select: {
                    id: true,
                    chapterNumber: true,
                    title: true,
                    isPremium: true,
                    coinCost: true,
                    createdAt: true,
                },
            },
            _count: {
                select: { chapters: true, bookmarks: true, comments: true },
            },
        },
    })
    return novel
}

function getStatusBadge(status: string) {
    switch (status) {
        case "COMPLETED":
            return "bg-green-500"
        case "ONGOING":
            return "bg-blue-500"
        case "HIATUS":
            return "bg-yellow-500"
        case "DROPPED":
            return "bg-red-500"
        default:
            return "bg-gray-500"
    }
}

export default async function NovelDetailPage({ params }: PageProps) {
    const { slug } = await params
    const novel = await getNovel(slug)

    if (!novel) {
        notFound()
    }

    const firstChapter = novel.chapters.length > 0
        ? novel.chapters[novel.chapters.length - 1]
        : null
    const latestChapter = novel.chapters.length > 0
        ? novel.chapters[0]
        : null

    return (
        <div className="py-6">
            {/* Novel Header */}
            <section className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Cover */}
                <div className="w-48 mx-auto md:mx-0 flex-shrink-0">
                    <div className="card overflow-hidden">
                        <div className="relative aspect-book">
                            {novel.cover ? (
                                <img
                                    src={getProxiedImageUrl(novel.cover) || novel.cover}
                                    alt={novel.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
                                    <BookOpen className="w-16 h-16 text-white/50" />
                                </div>
                            )}
                            {novel.isPremium && (
                                <div className="absolute top-2 left-2">
                                    <span className="badge badge-premium">
                                        <Crown className="w-3 h-3 mr-1" />
                                        VIP
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">{novel.title}</h1>

                    {novel.author && (
                        <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--text-secondary)] mb-3">
                            <User className="w-4 h-4" />
                            <span>{novel.author}</span>
                        </div>
                    )}

                    {/* Genres */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                        {novel.genres.map((genre) => (
                            <Link
                                key={genre.id}
                                href={`/genre/${genre.slug}`}
                                className="badge badge-secondary hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                            >
                                {genre.name}
                            </Link>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                        <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                            <span className="font-bold">{novel.avgRating.toFixed(1)}</span>
                            <span className="text-sm text-[var(--text-muted)]">
                                ({formatNumber(novel.ratingCount)})
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <Eye className="w-4 h-4" />
                            <span>{formatNumber(novel.totalViews)}</span>
                        </div>
                    </div>

                    {/* Status & Update */}
                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-[var(--text-secondary)] mb-6">
                        <span className={`badge ${getStatusBadge(novel.status)} text-white`}>{novel.status}</span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {novel._count.chapters} Chapter
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        {firstChapter ? (
                            <Link
                                href={`/novel/${novel.slug}/${firstChapter.chapterNumber}`}
                                className="btn btn-primary"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Mulai Baca
                            </Link>
                        ) : (
                            <button className="btn btn-primary" disabled>
                                Belum ada chapter
                            </button>
                        )}
                        {latestChapter && (
                            <Link
                                href={`/novel/${novel.slug}/${latestChapter.chapterNumber}`}
                                className="btn btn-secondary"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                Chapter Terbaru
                            </Link>
                        )}
                        <NovelActions novelId={novel.id} novelTitle={novel.title} />
                    </div>
                </div>
            </section>

            {/* Synopsis */}
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                    Sinopsis
                </h2>
                <div className="card p-4">
                    <p className="whitespace-pre-line text-[var(--text-secondary)] leading-relaxed">
                        {novel.synopsis}
                    </p>
                </div>
            </section>

            {/* Ratings & Reviews */}
            <section className="mb-8">
                <RatingSection novelId={novel.id} />
            </section>

            {/* Chapter List - Client Component for VIP-aware badges */}
            <NovelChapterSection
                chapters={(novel.chapters || []).map(ch => ({
                    id: ch.id,
                    chapterNumber: ch.chapterNumber,
                    title: ch.title,
                    isPremium: ch.isPremium,
                    coinCost: ch.coinCost,
                    createdAt: ch.createdAt.toISOString(),
                }))}
                novelSlug={novel.slug}
                totalChapters={novel._count.chapters}
            />

            {/* Comments */}
            <CommentSection novelId={novel.id} />
        </div>
    )
}
