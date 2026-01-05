"use client"

import Link from "next/link"
import { Crown, List } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

interface Chapter {
    id: string
    chapterNumber: number
    title: string
    isPremium: boolean
    coinCost: number
    createdAt: string
}

interface NovelChapterSectionProps {
    chapters: Chapter[]
    novelSlug: string
    totalChapters: number
}

export default function NovelChapterSection({
    chapters,
    novelSlug,
    totalChapters
}: NovelChapterSectionProps) {
    const { data: session } = useSession()
    const [isVip, setIsVip] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session?.user?.id) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    setIsVip(data.isVip || false)
                })
                .catch(() => setIsVip(false))
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [session?.user?.id])

    // Sort chapters for display
    const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber)
    const maxButtons = 15
    const showEllipsis = sortedChapters.length > maxButtons
    const displayChapters = showEllipsis
        ? [...sortedChapters.slice(0, 14), sortedChapters[sortedChapters.length - 1]]
        : sortedChapters

    // Chapters for list view (newest first)
    const listChapters = [...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber).slice(0, 10)

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <List className="w-5 h-5 text-[var(--color-primary)]" />
                    Daftar Chapter ({totalChapters})
                </h2>
            </div>

            {/* Chapter Number Buttons */}
            {chapters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                    {displayChapters.map((chapter, index) => (
                        <div key={chapter.id} className="flex items-center gap-2">
                            {showEllipsis && index === 14 && (
                                <span className="w-10 h-10 flex items-center justify-center text-[var(--text-muted)]">
                                    ...
                                </span>
                            )}
                            <Link
                                href={`/novel/${novelSlug}/${chapter.chapterNumber}`}
                                className="relative w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--bg-tertiary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors text-sm font-medium"
                                title={chapter.title}
                            >
                                {chapter.chapterNumber}
                                {/* Crown for premium chapters - hidden for VIP */}
                                {chapter.isPremium && !loading && !isVip && (
                                    <Crown className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-500 drop-shadow-sm" />
                                )}
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Chapter List */}
            <div className="card divide-y divide-[var(--bg-tertiary)]">
                {chapters.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                        Belum ada chapter
                    </div>
                ) : (
                    listChapters.map((chapter) => (
                        <Link
                            key={chapter.id}
                            href={`/novel/${novelSlug}/${chapter.chapterNumber}`}
                            className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-12 text-sm text-[var(--text-muted)]">
                                    Ch. {chapter.chapterNumber}
                                </span>
                                <span className="font-medium">{chapter.title}</span>
                                {/* Premium badge - hidden for VIP users */}
                                {chapter.isPremium && !loading && !isVip && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
                                        <Crown className="w-3 h-3" />
                                        VIP/{chapter.coinCost} coin
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

            {totalChapters > 10 && (
                <div className="text-center mt-4">
                    <Link href={`/novel/${novelSlug}/chapters`} className="btn btn-secondary">
                        Lihat Semua Chapter
                    </Link>
                </div>
            )}
        </section>
    )
}
