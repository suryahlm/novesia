"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, Home, BookOpen, List, Settings } from "lucide-react"
import SwipeWrapper from "@/components/reader/SwipeWrapper"
import ProgressTracker from "@/components/reader/ProgressTracker"
import { useReaderSettings, type ReaderTheme } from "@/components/reader/ReaderSettings"
import ReaderSettingsPanel from "@/components/reader/ReaderSettings"
import { useState, useEffect } from "react"

const fonts = {
    sans: "Inter, system-ui, sans-serif",
    serif: "Merriweather, Georgia, serif",
    mono: "JetBrains Mono, monospace",
}

const themes = {
    light: { bg: "#ffffff", text: "#1e293b" },
    sepia: { bg: "#f5f0e6", text: "#5c4b37" },
    dark: { bg: "#1a1a2e", text: "#e2e8f0" },
}

// Format content: convert newlines to paragraphs for proper spacing
function formatContent(content: string): string {
    if (!content) return ''

    // If content already has HTML paragraph tags, just clean it
    if (content.includes('<p>') || content.includes('<br')) {
        return content
    }

    // Split by double newlines (paragraph breaks) or single newlines
    const paragraphs = content
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0)

    // If no paragraphs found, try single newlines
    if (paragraphs.length <= 1 && content.includes('\n')) {
        return content
            .split(/\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(p => `<p>${p}</p>`)
            .join('')
    }

    return paragraphs.map(p => `<p>${p}</p>`).join('')
}

interface ChapterReaderClientProps {
    novel: {
        id: string
        title: string
        slug: string
        cover: string | null
    }
    chapter: {
        id: string
        chapterNumber: number
        title: string
        content: string
    }
    prevChapter: { chapterNumber: number } | null
    nextChapter: { chapterNumber: number } | null
}

export default function ChapterReaderClient({ novel, chapter, prevChapter, nextChapter }: ChapterReaderClientProps) {
    const { settings, setSettings } = useReaderSettings()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const currentTheme = themes[settings.theme as ReaderTheme] || themes.light

    // Cycle through themes
    const cycleTheme = () => {
        const themeOrder: ReaderTheme[] = ["light", "sepia", "dark"]
        const currentIndex = themeOrder.indexOf(settings.theme as ReaderTheme)
        const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]
        setSettings({ ...settings, theme: nextTheme })
    }

    const themeIcon = settings.theme === "light" ? "☀️" : settings.theme === "sepia" ? "📜" : "🌙"

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="animate-pulse">Memuat...</div>
            </div>
        )
    }

    return (
        <SwipeWrapper
            novelSlug={novel.slug}
            currentChapterId={chapter.id}
            prevChapter={prevChapter?.chapterNumber || null}
            nextChapter={nextChapter?.chapterNumber || null}
        >
            <ProgressTracker chapterId={chapter.id} />

            <div
                className="min-h-screen transition-colors duration-300"
                style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
            >
                {/* Top Navigation */}
                <header
                    className="fixed top-0 left-0 right-0 z-50 backdrop-blur border-b transition-colors duration-300"
                    style={{
                        backgroundColor: `${currentTheme.bg}F2`,
                        borderColor: `${currentTheme.text}20`,
                        color: currentTheme.text
                    }}
                >
                    <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href={`/novel/${novel.slug}`}
                                className="p-2 rounded-lg transition-colors hover:opacity-70"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{novel.title}</p>
                                <p className="text-xs opacity-70">
                                    Chapter {chapter.chapterNumber}: {chapter.title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Quick Theme Toggle */}
                            <button
                                onClick={cycleTheme}
                                className="p-2 rounded-lg transition-colors hover:opacity-70 text-lg"
                                title="Ganti Tema"
                            >
                                {themeIcon}
                            </button>
                            <Link
                                href={`/novel/${novel.slug}`}
                                className="p-2 rounded-lg transition-colors hover:opacity-70"
                                title="Daftar Chapter"
                            >
                                <List className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="pt-14 pb-20">
                    <article className="max-w-3xl mx-auto px-4 py-8 transition-all duration-300">
                        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center">
                            Chapter {chapter.chapterNumber}: {chapter.title}
                        </h1>

                        <div
                            className="prose prose-lg max-w-none leading-relaxed transition-all duration-300 chapter-content"
                            style={{
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: fonts[settings.fontFamily as keyof typeof fonts],
                                lineHeight: settings.lineHeight,
                            }}
                            dangerouslySetInnerHTML={{
                                __html: formatContent(chapter.content)
                            }}
                        />
                    </article>

                    {!chapter.content && (
                        <div className="text-center py-12 opacity-60">
                            <BookOpen className="w-12 h-12 mx-auto mb-4" />
                            <p>Konten chapter belum tersedia</p>
                        </div>
                    )}
                </main>

                {/* Bottom Navigation */}
                <nav
                    className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur border-t transition-colors duration-300"
                    style={{
                        backgroundColor: `${currentTheme.bg}F2`,
                        borderColor: `${currentTheme.text}20`,
                        color: currentTheme.text
                    }}
                >
                    <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                        {prevChapter ? (
                            <Link
                                href={`/novel/${novel.slug}/${prevChapter.chapterNumber}`}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                                style={{ backgroundColor: `${currentTheme.text}10` }}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="text-sm">Prev</span>
                            </Link>
                        ) : (
                            <div className="w-20" />
                        )}

                        <Link
                            href={`/novel/${novel.slug}`}
                            className="p-2 rounded-lg transition-colors hover:opacity-70"
                        >
                            <Home className="w-5 h-5" />
                        </Link>

                        {nextChapter ? (
                            <Link
                                href={`/novel/${novel.slug}/${nextChapter.chapterNumber}`}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg transition-colors hover:opacity-80"
                            >
                                <span className="text-sm">Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <div className="w-20" />
                        )}
                    </div>
                </nav>

                {/* Settings Button */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="fixed bottom-20 right-4 z-40 p-3 bg-[var(--color-primary)] text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    aria-label="Reader Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>

                {/* Settings Panel */}
                <ReaderSettingsPanel
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    settings={settings}
                    onSettingsChange={setSettings}
                />
            </div>
        </SwipeWrapper>
    )
}
