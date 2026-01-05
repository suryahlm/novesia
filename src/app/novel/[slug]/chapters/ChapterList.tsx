"use client"

import Link from "next/link"
import { Crown } from "lucide-react"
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

interface ChapterListProps {
    chapters: Chapter[]
    novelSlug: string
}

export function ChapterList({ chapters, novelSlug }: ChapterListProps) {
    const { data: session, status } = useSession()
    const [isVip, setIsVip] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Wait until session status is determined
        if (status === "loading") return

        if (session?.user?.id) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    setIsVip(data.isVip || false)
                })
                .catch(() => setIsVip(false))
                .finally(() => setLoading(false))
        } else {
            // Not logged in - show badges
            setLoading(false)
        }
    }, [session?.user?.id, status])

    return (
        <>
            {/* Chapter Number Buttons */}
            {chapters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {chapters.map((chapter) => (
                        <Link
                            key={chapter.id}
                            href={`/novel/${novelSlug}/${chapter.chapterNumber}`}
                            className="relative w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--bg-tertiary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors text-sm font-medium"
                            title={chapter.title}
                        >
                            {chapter.chapterNumber}
                            {/* Crown icon for premium chapters - hidden for VIP users */}
                            {chapter.isPremium && !loading && !isVip && (
                                <Crown className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-500 drop-shadow-sm" />
                            )}
                        </Link>
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
                    chapters.map((chapter) => (
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
        </>
    )
}
