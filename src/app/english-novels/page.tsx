"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { BookOpen, Eye, Search, Loader2, Globe } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { getProxiedImageUrl } from "@/lib/image-utils"

interface Novel {
    id: string
    title: string
    slug: string
    cover: string | null
    author: string | null
    synopsis: string
    status: "ONGOING" | "COMPLETED" | "HIATUS" | "DROPPED"
    totalViews: number
    avgRating: number
    isPremium: boolean
    genres: { id: string; name: string; slug: string }[]
    _count: { chapters: number }
}

function EnglishNovelsContent() {
    const searchParams = useSearchParams()
    const [novels, setNovels] = useState<Novel[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Build API URL - filter for English novels
    const buildApiUrl = () => {
        const params = new URLSearchParams()
        params.set("language", "en") // Filter English only

        const q = searchParams.get("q")
        const genres = searchParams.get("genres")
        const status = searchParams.get("status")
        const sort = searchParams.get("sort")

        if (q) params.set("q", q)
        if (genres) params.set("genres", genres)
        if (status) params.set("status", status)
        if (sort) params.set("sort", sort)

        return `/api/novels?${params.toString()}`
    }

    // Fetch novels when params change
    useEffect(() => {
        setIsLoading(true)
        fetch(buildApiUrl())
            .then((res) => res.json())
            .then((data) => {
                setNovels(data)
                setIsLoading(false)
            })
            .catch(() => {
                setIsLoading(false)
            })
    }, [searchParams])

    const query = searchParams.get("q")

    return (
        <div className="pb-4 sm:py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <Globe className="w-6 h-6 text-blue-500" />
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            {query ? `Search: "${query}"` : "English Novels"}
                        </h1>
                    </div>
                    <p className="text-sm sm:text-base text-[var(--text-muted)]">
                        {query
                            ? `Found ${novels.length} novels`
                            : "Read novels in their original English translation"}
                    </p>
                </div>

                {/* Search Bar */}
                <form action="/english-novels" method="GET" className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query || ""}
                            placeholder="Search novel title..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </form>

                {/* Info Banner */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Original English Translations</p>
                            <p className="text-xs text-[var(--text-muted)]">
                                These novels are in English, not yet translated to Indonesian
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : novels.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                        <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No English novels available yet</p>
                        <p className="text-sm mt-2">Coming soon!</p>
                    </div>
                ) : (
                    /* Novel Grid */
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
                                            src={getProxiedImageUrl(novel.cover) || novel.cover}
                                            alt={novel.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-white/50" />
                                        </div>
                                    )}
                                    {/* English Badge */}
                                    <div className="absolute top-2 right-2">
                                        <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded font-medium">
                                            EN
                                        </span>
                                    </div>
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
                                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-500 transition-colors">
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
                )}
            </div>
        </div>
    )
}

export default function EnglishNovelsPage() {
    return (
        <Suspense fallback={
            <div className="pb-4 sm:py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-4 sm:mb-6">
                        <div className="h-8 w-48 skeleton rounded mb-2" />
                        <div className="h-5 w-64 skeleton rounded" />
                    </div>
                    <div className="h-10 skeleton rounded-lg mb-4" />
                    <div className="h-16 skeleton rounded-lg mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <div key={i} className="card">
                                <div className="aspect-[3/4] skeleton" />
                                <div className="p-2 sm:p-3 space-y-2">
                                    <div className="h-4 skeleton rounded" />
                                    <div className="h-3 w-2/3 skeleton rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        }>
            <EnglishNovelsContent />
        </Suspense>
    )
}
