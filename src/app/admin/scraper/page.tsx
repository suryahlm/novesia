"use client"

import { useState, useEffect } from "react"
import {
    BookOpen,
    FileText,
    Languages,
    TrendingUp,
    RefreshCw,
    Server,
    Clock,
    CheckCircle,
} from "lucide-react"

interface VpsStats {
    novels: {
        total: number
        recentlyAdded: number
    }
    chapters: {
        total: number
        translated: number
        untranslated: number
        recentlyAdded: number
        translationProgress: number
    }
}

export default function ScraperPage() {
    const [stats, setStats] = useState<VpsStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/scraper/stats", { credentials: "include" })
            if (res.ok) {
                const data = await res.json()
                setStats(data)
                setLastUpdated(new Date())
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">VPS Scraper Dashboard</h1>
                <p className="text-[var(--text-secondary)]">
                    Monitor scraping dan translasi novel dari VPS
                </p>
            </div>

            {/* VPS Status Banner */}
            <div className="card p-4 mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                        <Server className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-green-600 dark:text-green-400">VPS Scraper Aktif</p>
                        <p className="text-sm text-[var(--text-muted)]">
                            Scraping otomatis setiap 3 jam • Translator setiap 1 jam
                        </p>
                    </div>
                    <div className="text-right text-sm text-[var(--text-muted)]">
                        {lastUpdated && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Update: {lastUpdated.toLocaleTimeString("id-ID")}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--color-primary)]" />
                    <p className="text-[var(--text-muted)]">Memuat data...</p>
                </div>
            ) : stats ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="card p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <BookOpen className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-sm text-[var(--text-muted)]">Total Novel</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.novels.total}</p>
                            {stats.novels.recentlyAdded > 0 && (
                                <p className="text-xs text-green-500">+{stats.novels.recentlyAdded} hari ini</p>
                            )}
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                    <FileText className="w-5 h-5 text-purple-500" />
                                </div>
                                <span className="text-sm text-[var(--text-muted)]">Total Chapter</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.chapters.total.toLocaleString()}</p>
                            {stats.chapters.recentlyAdded > 0 && (
                                <p className="text-xs text-green-500">+{stats.chapters.recentlyAdded} hari ini</p>
                            )}
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <Languages className="w-5 h-5 text-green-500" />
                                </div>
                                <span className="text-sm text-[var(--text-muted)]">Ter-translate</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.chapters.translated.toLocaleString()}</p>
                            <p className="text-xs text-[var(--text-muted)]">{stats.chapters.translationProgress}% selesai</p>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                                </div>
                                <span className="text-sm text-[var(--text-muted)]">Antrian Translate</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-500">{stats.chapters.untranslated.toLocaleString()}</p>
                            <p className="text-xs text-[var(--text-muted)]">dalam antrian</p>
                        </div>
                    </div>

                    {/* Translation Progress Bar */}
                    <div className="card p-6 mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold">Progress Translasi</span>
                            <span className="text-sm text-[var(--text-muted)]">
                                {stats.chapters.translated.toLocaleString()} / {stats.chapters.total.toLocaleString()} chapter
                            </span>
                        </div>
                        <div className="h-4 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                                style={{ width: `${stats.chapters.translationProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-lg font-bold text-green-500">
                                {stats.chapters.translationProgress}% Complete
                            </span>
                        </div>
                    </div>

                    {/* VPS Info */}
                    <div className="card p-6">
                        <h2 className="font-semibold mb-4">📡 Informasi VPS Scraper</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span><strong>Scraper:</strong> Otomatis setiap 3 jam (10 novel trending, semua chapter)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span><strong>Translator:</strong> Otomatis setiap 1 jam (20 chapter per batch via Groq)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span><strong>Sumber:</strong> asianovel.net (bypass Cloudflare dengan Puppeteer Stealth)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                <span><strong>Lokasi VPS:</strong> /var/www/novesia-scraper</span>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                            <p className="text-sm text-[var(--text-muted)]">
                                💡 <strong>Tip:</strong> Untuk menambah novel secara manual, gunakan VPS terminal:
                            </p>
                            <code className="block mt-2 text-xs bg-black/20 p-2 rounded">
                                cd /var/www/novesia-scraper && node scraper.js
                            </code>
                        </div>
                    </div>
                </>
            ) : (
                <div className="card p-8 text-center text-[var(--text-muted)]">
                    Gagal memuat data. Pastikan Anda login sebagai admin.
                </div>
            )}
        </div>
    )
}
