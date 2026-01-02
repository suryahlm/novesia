import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, Eye, ChevronLeft } from "lucide-react"
import { formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function getGenreWithNovels(slug: string) {
    const genre = await prisma.genre.findUnique({
        where: { slug },
        include: {
            novels: {
                include: {
                    genres: { take: 2 },
                    _count: { select: { chapters: true } },
                },
            },
        },
    })
    return genre
}

export default async function GenreDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const genre = await getGenreWithNovels(slug)

    if (!genre) {
        notFound()
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button & Header */}
                <div className="mb-8">
                    <Link
                        href="/genre"
                        className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Kembali ke Genre
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">{genre.name}</h1>
                    <p className="text-[var(--text-muted)]">
                        {genre.novels.length} novel dalam genre ini
                    </p>
                </div>

                {/* Novel Grid */}
                {genre.novels.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {genre.novels.map((novel) => (
                            <Link
                                key={novel.id}
                                href={`/novel/${novel.slug}`}
                                className="card group hover:scale-[1.02] transition-transform"
                            >
                                <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                                    {novel.cover ? (
                                        <img
                                            src={novel.cover}
                                            alt={novel.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-white/50" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
                                        {novel.genres.slice(0, 2).map((g) => (
                                            <span
                                                key={g.id}
                                                className="text-xs px-2 py-0.5 bg-black/50 text-white rounded"
                                            >
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                                        {novel.title}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {novel._count.chapters}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {formatNumber(novel.totalViews)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="card p-12 text-center">
                        <BookOpen className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Belum ada novel</h3>
                        <p className="text-[var(--text-muted)] mb-6">
                            Belum ada novel dalam genre {genre.name}
                        </p>
                        <Link href="/discover" className="btn btn-primary">
                            Jelajahi Novel Lain
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
