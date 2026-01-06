"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BookOpen, Play, ChevronRight, Clock } from "lucide-react"
import { getProxiedImageUrl } from "@/lib/image-utils"

interface ReadingHistoryItem {
    id: string
    progress: number
    readAt: string
    novel: {
        id: string
        title: string
        slug: string
        cover: string | null
        _count: { chapters: number }
    }
    chapter: {
        id: string
        chapterNumber: number
        title: string
    }
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Baru saja"
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`
    return date.toLocaleDateString("id-ID")
}

export default function ContinueReadingSection() {
    const { data: session, status } = useSession()
    const [history, setHistory] = useState<ReadingHistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!session) {
            setIsLoading(false)
            return
        }

        fetch("/api/user/history")
            .then((res) => res.json())
            .then((data) => {
                // Only take first 5 for homepage
                setHistory(data.slice(0, 5))
            })
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [session])

    // Don't render if not logged in or loading auth
    if (status === "loading" || !session) {
        return null
    }

    // Don't render if no history
    if (!isLoading && history.length === 0) {
        return null
    }

    return (
        <section className="mb-6 sm:mb-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                    <h2 className="text-lg font-bold">Lanjutkan Baca</h2>
                </div>
                <Link
                    href="/library"
                    className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                    Lihat Semua
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {isLoading ? (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-72 sm:w-80 flex-shrink-0">
                            <div className="card flex gap-3 p-3">
                                <div className="w-16 h-24 skeleton rounded-lg flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 skeleton rounded w-3/4" />
                                    <div className="h-3 skeleton rounded w-1/2" />
                                    <div className="h-8 skeleton rounded w-full mt-2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                    {history.map((item) => (
                        <div key={item.id} className="w-72 sm:w-80 flex-shrink-0">
                            <div className="card flex gap-3 p-3 hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                                {/* Cover */}
                                <Link href={`/novel/${item.novel.slug}`} className="flex-shrink-0">
                                    <div className="w-16 h-24 rounded-lg overflow-hidden relative">
                                        {item.novel.cover ? (
                                            <img
                                                src={getProxiedImageUrl(item.novel.cover) || item.novel.cover}
                                                alt={item.novel.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
                                                <BookOpen className="w-6 h-6 text-white/50" />
                                            </div>
                                        )}
                                        {/* Progress overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                            <div
                                                className="h-full bg-[var(--color-primary)]"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </Link>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <Link href={`/novel/${item.novel.slug}`}>
                                        <h3 className="font-medium text-sm line-clamp-1 hover:text-[var(--color-primary)] transition-colors">
                                            {item.novel.title}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(item.readAt)}
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        Ch. {item.chapter.chapterNumber} • {item.progress}% selesai
                                    </p>

                                    {/* Continue Button */}
                                    <Link
                                        href={`/read/${item.chapter.id}`}
                                        className="mt-auto pt-2"
                                    >
                                        <button className="btn btn-primary w-full text-sm py-1.5">
                                            <Play className="w-3 h-3 mr-1.5 fill-current" />
                                            Lanjutkan
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
