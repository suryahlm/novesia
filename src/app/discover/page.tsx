import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BookOpen, Eye, Search } from "lucide-react"
import { formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface DiscoverPageProps {
    searchParams: Promise<{ q?: string }>
}

async function getNovels(query?: string) {
    const novels = await prisma.novel.findMany({
        where: query
            ? {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { author: { contains: query, mode: "insensitive" } },
                ],
            }
            : undefined,
        orderBy: { totalViews: "desc" },
        include: {
            genres: { take: 2 },
            _count: { select: { chapters: true } },
        },
    })
    return novels
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
    const params = await searchParams
    const query = params.q
    const novels = await getNovels(query)

    return (
        <div className="pb-4 sm:py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-4 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                        {query ? `Hasil Pencarian: "${query}"` : "Jelajahi Novel"}
                    </h1>
                    <p className="text-sm sm:text-base text-[var(--text-muted)]">
                        {query
                            ? `Ditemukan ${novels.length} novel`
                            : "Temukan cerita menarik dari berbagai genre"}
                    </p>
                </div>

                {/* Search Bar for Mobile */}
                <form
                    action="/discover"
                    method="GET"
                    className="mb-4 sm:mb-6"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Cari judul novel..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                        />
                    </div>
                </form>

                {/* Request Novel Link */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-[var(--color-primary)]/10 to-purple-500/10 rounded-lg border border-[var(--color-primary)]/20">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium">Tidak menemukan novel?</p>
                            <p className="text-xs text-[var(--text-muted)]">Request novel favoritmu!</p>
                        </div>
                        <a
                            href="/request"
                            className="btn btn-primary text-sm py-2 px-3"
                        >
                            Request
                        </a>
                    </div>
                </div>
                {/* Novel Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
                            <div className="p-2 sm:p-3">
                                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                                    {novel.title}
                                </h3>
                                <div className="mt-1.5 sm:mt-2 flex items-center gap-2 sm:gap-3 text-xs text-[var(--text-muted)]">
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
                        {query
                            ? `Tidak ada novel yang cocok dengan "${query}"`
                            : "Belum ada novel tersedia"}
                    </div>
                )}
            </div>
        </div>
    )
}
