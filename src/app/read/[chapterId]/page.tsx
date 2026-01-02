"use client"

import { useState, useEffect, useRef, use } from "react"
import Link from "next/link"
import {
    ChevronLeft,
    ChevronRight,
    Settings,
    Home,
    List,
    MessageSquare,
    Share2,
    Crown,
    Coins,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ReaderSettingsPanel, {
    useReaderSettings,
} from "@/components/reader/ReaderSettings"

interface ChapterData {
    id: string
    novelId: string
    novelTitle: string
    novelSlug: string
    novelCover?: string
    number: number
    title: string
    content: string
    isPremium: boolean
    coinCost: number
    views: number
    wordCount: number
    prevChapter: {
        id: string
        number: number
        title: string
        isPremium: boolean
        coinCost: number
    } | null
    nextChapter: {
        id: string
        number: number
        title: string
        isPremium: boolean
        coinCost: number
    } | null
}

const fonts = {
    sans: "Inter, system-ui, sans-serif",
    serif: "Merriweather, Georgia, serif",
    mono: "JetBrains Mono, monospace",
}

export default function ReaderPage({ params }: { params: Promise<{ chapterId: string }> }) {
    const resolvedParams = use(params)
    const { settings, setSettings } = useReaderSettings()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isHeaderVisible, setIsHeaderVisible] = useState(true)
    const [progress, setProgress] = useState(0)
    const lastScrollY = useRef(0)
    const contentRef = useRef<HTMLDivElement>(null)

    const [chapter, setChapter] = useState<ChapterData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch chapter data
    useEffect(() => {
        const fetchChapter = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const res = await fetch(`/api/chapters/${resolvedParams.chapterId}`)
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Failed to fetch chapter")
                }
                const data = await res.json()
                setChapter(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load chapter")
            } finally {
                setIsLoading(false)
            }
        }

        fetchChapter()
    }, [resolvedParams.chapterId])

    // Auto-hide header on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Calculate reading progress
            const windowHeight = window.innerHeight
            const documentHeight = document.documentElement.scrollHeight
            const scrollProgress = (currentScrollY / (documentHeight - windowHeight)) * 100
            setProgress(Math.min(100, Math.max(0, scrollProgress)))

            // Hide/show header based on scroll direction
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setIsHeaderVisible(false)
            } else {
                setIsHeaderVisible(true)
            }
            lastScrollY.current = currentScrollY
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Get theme classes
    const themeClasses = {
        light: "bg-white text-[#1e293b]",
        sepia: "bg-[#f5f0e6] text-[#5c4b37]",
        dark: "bg-[#1a1a2e] text-[#e2e8f0]",
    }

    const headerBgClasses = {
        light: "bg-white/95",
        sepia: "bg-[#f5f0e6]/95",
        dark: "bg-[#1a1a2e]/95",
    }

    // Loading state
    if (isLoading) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", themeClasses[settings.theme])}>
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Memuat chapter...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !chapter) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", themeClasses[settings.theme])}>
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error || "Chapter tidak ditemukan"}</p>
                    <Link href="/" className="btn btn-primary">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("min-h-screen", themeClasses[settings.theme])}>
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-black/10">
                <div
                    className="h-full bg-[var(--color-primary)] transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <header
                className={cn(
                    "fixed top-1 left-0 right-0 z-40 backdrop-blur-md transition-transform duration-300",
                    headerBgClasses[settings.theme],
                    isHeaderVisible ? "translate-y-0" : "-translate-y-full"
                )}
            >
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/novel/${chapter.novelSlug}`}
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium truncate max-w-[200px]">
                                {chapter.novelTitle}
                            </p>
                            <p className="text-xs opacity-70">
                                Chapter {chapter.number}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Link
                            href="/"
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                            title="Beranda"
                        >
                            <Home className="w-5 h-5" />
                        </Link>
                        <Link
                            href={`/novel/${chapter.novelSlug}`}
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                            title="Daftar Chapter"
                        >
                            <List className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                            title="Pengaturan"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 pt-20 pb-32">
                {/* Chapter Title */}
                <div className="mb-8 text-center">
                    <p className="text-sm opacity-70 mb-2">Chapter {chapter.number}</p>
                    <h1 className="text-2xl font-bold">{chapter.title}</h1>
                    <p className="text-sm opacity-50 mt-2">{chapter.wordCount} kata • {chapter.views} views</p>
                </div>

                {/* Chapter Content */}
                <article
                    ref={contentRef}
                    className="reader-content"
                    style={{
                        fontSize: `${settings.fontSize}px`,
                        fontFamily: fonts[settings.fontFamily],
                        lineHeight: settings.lineHeight,
                    }}
                >
                    {chapter.content.split("\n\n").map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </article>

                {/* End of Chapter */}
                <div className="text-center my-12 py-8 border-t border-b border-current/10">
                    <p className="text-lg font-medium mb-2">— Akhir Chapter {chapter.number} —</p>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <button className="btn btn-ghost text-sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Komentar
                        </button>
                        <button className="btn btn-ghost text-sm">
                            <Share2 className="w-4 h-4 mr-2" />
                            Bagikan
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation */}
            <footer
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md transition-transform duration-300",
                    headerBgClasses[settings.theme],
                    isHeaderVisible ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Prev Chapter */}
                    {chapter.prevChapter ? (
                        <Link
                            href={`/read/${chapter.prevChapter.id}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm">
                                Ch. {chapter.prevChapter.number}
                            </span>
                        </Link>
                    ) : (
                        <div className="w-20" />
                    )}

                    {/* Chapter Number */}
                    <div className="text-center">
                        <span className="font-medium">Chapter {chapter.number}</span>
                    </div>

                    {/* Next Chapter */}
                    {chapter.nextChapter ? (
                        chapter.nextChapter.isPremium ? (
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-colors"
                            >
                                <span className="hidden sm:inline text-sm">
                                    Ch. {chapter.nextChapter.number}
                                </span>
                                <Crown className="w-4 h-4" />
                                <span className="text-sm font-medium">{chapter.nextChapter.coinCost}</span>
                                <Coins className="w-4 h-4" />
                            </button>
                        ) : (
                            <Link
                                href={`/read/${chapter.nextChapter.id}`}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/10 transition-colors"
                            >
                                <span className="hidden sm:inline text-sm">
                                    Ch. {chapter.nextChapter.number}
                                </span>
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        )
                    ) : (
                        <div className="w-20" />
                    )}
                </div>
            </footer>

            {/* Settings Panel */}
            <ReaderSettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />
        </div>
    )
}
