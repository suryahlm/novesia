"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Library, BookOpen, Heart, Folder, LogIn, Loader2 } from "lucide-react"

interface Novel {
    id: string
    title: string
    slug: string
    cover: string | null
    author: string | null
    _count: { chapters: number }
}

interface ReadingHistoryItem {
    novel: Novel
    chapter: { chapterNumber: number; title: string }
    progress: number
    readAt: string
}

interface BookmarkItem {
    novel: Novel
    createdAt: string
}

export default function LibraryPage() {
    const { data: session, status } = useSession()
    const [activeTab, setActiveTab] = useState<"history" | "bookmarks" | "collections">("history")
    const [history, setHistory] = useState<ReadingHistoryItem[]>([])
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!session) return

        async function fetchData() {
            setIsLoading(true)
            try {
                if (activeTab === "history") {
                    const response = await fetch("/api/user/history")
                    if (response.ok) {
                        const data = await response.json()
                        setHistory(data)
                    }
                } else if (activeTab === "bookmarks") {
                    const response = await fetch("/api/bookmarks")
                    if (response.ok) {
                        const data = await response.json()
                        setBookmarks(data)
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [session, activeTab])

    if (status === "loading") {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="text-center">
                    <Library className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Pustaka Kamu</h1>
                    <p className="text-[var(--text-muted)] mb-6">
                        Masuk untuk melihat koleksi novel kamu
                    </p>
                    <Link href="/login" className="btn btn-primary">
                        <LogIn className="w-4 h-4 mr-2" />
                        Masuk
                    </Link>
                </div>
            </div>
        )
    }

    const tabs = [
        { id: "history" as const, label: "Riwayat Baca", icon: BookOpen },
        { id: "bookmarks" as const, label: "Bookmark", icon: Heart },
        { id: "collections" as const, label: "Koleksi", icon: Folder },
    ]

    return (
        <div className="pb-4 sm:py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Pustaka Saya</h1>
                    <p className="text-[var(--text-muted)]">
                        Koleksi novel dan riwayat baca kamu
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-[var(--bg-tertiary)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 font-medium flex items-center gap-2 transition-colors ${activeTab === tab.id
                                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
                    </div>
                ) : activeTab === "history" ? (
                    history.length === 0 ? (
                        <div className="card p-12 text-center">
                            <BookOpen className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Belum ada riwayat baca</h3>
                            <p className="text-[var(--text-muted)] mb-6">
                                Mulai membaca novel untuk melihat riwayat di sini
                            </p>
                            <Link href="/discover" className="btn btn-primary">
                                Jelajahi Novel
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {history.map((item) => (
                                <Link
                                    key={item.novel.id}
                                    href={`/novel/${item.novel.slug}`}
                                    className="card group hover:scale-[1.02] transition-transform"
                                >
                                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                                        {item.novel.cover ? (
                                            <img
                                                src={item.novel.cover}
                                                alt={item.novel.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
                                                <BookOpen className="w-12 h-12 text-white/50" />
                                            </div>
                                        )}
                                        {/* Progress bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                            <div
                                                className="h-full bg-[var(--color-primary)]"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                                            {item.novel.title}
                                        </h3>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">
                                            Ch. {item.chapter.chapterNumber}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                ) : activeTab === "bookmarks" ? (
                    bookmarks.length === 0 ? (
                        <div className="card p-12 text-center">
                            <Heart className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Belum ada bookmark</h3>
                            <p className="text-[var(--text-muted)] mb-6">
                                Simpan novel favorit kamu di sini
                            </p>
                            <Link href="/discover" className="btn btn-primary">
                                Jelajahi Novel
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {bookmarks.map((item) => (
                                <Link
                                    key={item.novel.id}
                                    href={`/novel/${item.novel.slug}`}
                                    className="card group hover:scale-[1.02] transition-transform"
                                >
                                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                                        {item.novel.cover ? (
                                            <img
                                                src={item.novel.cover}
                                                alt={item.novel.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
                                                <BookOpen className="w-12 h-12 text-white/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                                            {item.novel.title}
                                        </h3>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">
                                            {item.novel._count.chapters} chapter
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="card p-12 text-center">
                        <Folder className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Fitur Koleksi</h3>
                        <p className="text-[var(--text-muted)]">
                            Segera hadir! Buat koleksi novel sesuai kategori favoritmu.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
