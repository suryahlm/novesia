"use client"

import Link from "next/link"
import { Crown, BookOpen } from "lucide-react"
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
    novelId?: string
}

export function ChapterList({ chapters, novelSlug, novelId }: ChapterListProps) {
    const { data: session, status } = useSession()
    const [isVip, setIsVip] = useState(false)
    const [loading, setLoading] = useState(true)
    const [lastReadChapter, setLastReadChapter] = useState<number | null>(null)

    useEffect(() => {
        // Wait until session status is determined
        if (status === "loading") return

        if (session?.user?.id) {
            // Fetch user profile and last read chapter
            Promise.all([
                fetch("/api/user/profile").then(res => res.json()),
                fetch(`/api/user/history?novelSlug=${novelSlug}`).then(res => res.json())
            ])
                .then(([profileData, historyData]) => {
                    setIsVip(profileData.isVip || false)
                    // Get the highest chapter number that was read
                    if (historyData.lastReadChapter) {
                        setLastReadChapter(historyData.lastReadChapter)
                    }
                })
                .catch(() => {
                    setIsVip(false)
                })
                .finally(() => setLoading(false))
        } else {
            // Not logged in
            setLoading(false)
        }
    }, [session?.user?.id, status, novelSlug])

    return (
        <>
            {/* Last Read Banner */}
            {lastReadChapter && (
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 border border-[var(--color-primary)]/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                            <span className="text-sm">
                                Terakhir dibaca: <strong>Chapter {lastReadChapter}</strong>
                            </span>
                        </div>
                        <Link
                            href={`/novel/${novelSlug}/${lastReadChapter}`}
                            className="btn btn-primary btn-sm text-xs"
                        >
                            Lanjut Baca
                        </Link>
                    </div>
                </div>
            )}

            {/* Chapter Number Buttons */}
            {chapters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {chapters.map((chapter) => (
                        <Link
                            key={chapter.id}
                            href={`/novel/${novelSlug}/${chapter.chapterNumber}`}
                            className={`relative w-10 h-10 flex items-center justify-center rounded-lg border transition-colors text-sm font-medium ${lastReadChapter === chapter.chapterNumber
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                    : "border-[var(--bg-tertiary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]"
                                }`}
                            title={chapter.title}
                        >
                            {chapter.chapterNumber}
                            {/* Crown icon for premium chapters - hidden for VIP users */}
                            {chapter.isPremium && !loading && !isVip && (
                                <Crown className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-500 drop-shadow-sm" />
                            )}
                            {/* Last read bookmark indicator */}
                            {lastReadChapter === chapter.chapterNumber && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full" />
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
                            className={`flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors ${lastReadChapter === chapter.chapterNumber
                                    ? "bg-[var(--color-primary)]/10 border-l-4 border-l-[var(--color-primary)]"
                                    : ""
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-12 text-sm text-[var(--text-muted)]">
                                    Ch. {chapter.chapterNumber}
                                </span>
                                <span className="font-medium">{chapter.title}</span>
                                {/* Last read badge */}
                                {lastReadChapter === chapter.chapterNumber && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                        <BookOpen className="w-3 h-3" />
                                        Terakhir
                                    </span>
                                )}
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
