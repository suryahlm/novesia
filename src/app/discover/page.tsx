import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BookOpen, Eye, Star } from "lucide-react"
import { formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function getNovels() {
    const novels = await prisma.novel.findMany({
        orderBy: { totalViews: "desc" },
        include: {
            genres: { take: 2 },
            _count: { select: { chapters: true } },
        },
    })
    return novels
}

export default async function DiscoverPage() {
    const novels = await getNovels()

    return (
        <div className="pb-4 sm:py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-4 sm:mb-8">
                    <h1 className="text-3xl font-bold mb-2">Jelajahi Novel</h1>
                    <p className="text-[var(--text-muted)]">
                        Temukan cerita menarik dari berbagai genre
                    </p>
                </div>

                {/* Novel Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {novels.map((novel) => (
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
                                    {novel.genres.slice(0, 2).map((genre) => (
                                        <span
                                            key={genre.id}
                                            className="text-xs px-2 py-0.5 bg-black/50 text-white rounded"
                                        >
                                            {genre.name}
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

                {novels.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                        Belum ada novel tersedia
                    </div>
                )}
            </div>
        </div>
    )
}
