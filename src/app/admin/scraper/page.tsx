"use client"

import { useState, useEffect } from "react"
import {
    Download,
    Play,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    Link as LinkIcon,
    Trash2,
    BookOpen,
    FileText,
    Languages,
    TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ScrapeJob {
    id: string
    novelUrl: string
    status: string
    totalChapters: number
    scrapedChapters: number
    novelId: string | null
    error: string | null
    createdAt: string
    completedAt: string | null
}

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

const statusConfig = {
    PENDING: { icon: Clock, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800", label: "Menunggu" },
    SCRAPING: { icon: Download, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Scraping" },
    TRANSLATING: { icon: RefreshCw, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Translating" },
    COMPLETED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30", label: "Selesai" },
    FAILED: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", label: "Gagal" },
}

export default function ScraperPage() {
    const [newUrl, setNewUrl] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [jobs, setJobs] = useState<ScrapeJob[]>([])
    const [stats, setStats] = useState<VpsStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/scraper/jobs", { credentials: "include" })
            if (res.ok) {
                const data = await res.json()
                setJobs(data)
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error)
        }
    }

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/scraper/stats", { credentials: "include" })
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error)
        }
    }

    useEffect(() => {
        Promise.all([fetchJobs(), fetchStats()]).finally(() => setIsLoading(false))
        const interval = setInterval(() => {
            fetchJobs()
            fetchStats()
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUrl.trim()) {
            alert("Masukkan URL novel terlebih dahulu")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/scraper", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ novelUrl: newUrl }),
            })
            const data = await res.json()
            if (res.ok) {
                alert(`✅ Job scraping dimulai!\nJob ID: ${data.jobId}`)
                setNewUrl("")
                fetchJobs()
            } else {
                alert(`❌ Error: ${data.error || "Gagal memulai scraping"}`)
            }
        } catch (error) {
            alert(`❌ Terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus job ini?")) return
        try {
            const res = await fetch(`/api/scraper/jobs/${id}`, { method: "DELETE", credentials: "include" })
            if (res.ok) {
                alert("✅ Job dihapus")
                fetchJobs()
            }
        } catch (error) {
            console.error("Failed to delete job:", error)
        }
    }

    const handleCancel = async (id: string) => {
        if (!confirm("Batalkan job ini?")) return
        try {
            const res = await fetch(`/api/scraper/jobs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "cancel" }),
            })
            if (res.ok) {
                alert("✅ Job dibatalkan")
                fetchJobs()
            }
        } catch (error) {
            console.error("Failed to cancel job:", error)
        }
    }

    const activeJobs = jobs.filter((job) => ["PENDING", "SCRAPING", "TRANSLATING"].includes(job.status))
    const completedJobs = jobs.filter((job) => ["COMPLETED", "FAILED"].includes(job.status))

    return (
        <div className="py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">VPS Scraper Dashboard</h1>
                <p className="text-[var(--text-secondary)]">
                    Monitor scraping dan translasi novel dari VPS
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
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
                        <p className="text-2xl font-bold">{stats.chapters.total}</p>
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
                        <p className="text-2xl font-bold">{stats.chapters.translated}</p>
                        <p className="text-xs text-[var(--text-muted)]">{stats.chapters.translationProgress}% selesai</p>
                    </div>

                    <div className="card p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                                <TrendingUp className="w-5 h-5 text-yellow-500" />
                            </div>
                            <span className="text-sm text-[var(--text-muted)]">Belum Translate</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-500">{stats.chapters.untranslated}</p>
                        <p className="text-xs text-[var(--text-muted)]">dalam antrian</p>
                    </div>
                </div>
            )}

            {/* Translation Progress Bar */}
            {stats && stats.chapters.total > 0 && (
                <div className="card p-4 mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Progress Translasi</span>
                        <span className="text-sm text-[var(--text-muted)]">
                            {stats.chapters.translated} / {stats.chapters.total} chapter
                        </span>
                    </div>
                    <div className="h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                            style={{ width: `${stats.chapters.translationProgress}%` }}
                        />
                    </div>
                    <p className="text-center text-sm font-medium mt-2 text-green-500">
                        {stats.chapters.translationProgress}% Complete
                    </p>
                </div>
            )}

            {/* New Scrape Job Form */}
            <div className="card p-6 mb-8">
                <h2 className="font-semibold mb-4">Tambah Job Scraping Baru</h2>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://www.asianovel.net/novel-title"
                            className="input pl-11"
                            required
                        />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary whitespace-nowrap">
                        {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Play className="w-4 h-4 mr-2" />Mulai Scraping</>}
                    </button>
                </form>
                <p className="text-sm text-[var(--text-muted)] mt-3">
                    ⚡ VPS akan scrape novel secara otomatis tiap 3 jam. Translator berjalan tiap 1 jam.
                </p>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--color-primary)]" />
                    <p className="text-[var(--text-muted)]">Memuat data...</p>
                </div>
            ) : (
                <>
                    {/* Active Jobs */}
                    <div className="mb-6">
                        <h2 className="font-semibold mb-4">Job Aktif ({activeJobs.length})</h2>
                        {activeJobs.length === 0 ? (
                            <div className="card p-8 text-center text-[var(--text-muted)]">
                                Tidak ada job yang sedang berjalan
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {activeJobs.map((job) => {
                                    const config = statusConfig[job.status as keyof typeof statusConfig]
                                    const progress = job.totalChapters ? Math.round((job.scrapedChapters / job.totalChapters) * 100) : 0
                                    return (
                                        <div key={job.id} className="card p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-medium">{job.novelId ? "Novel ID: " + job.novelId : "Fetching..."}</p>
                                                    <p className="text-sm text-[var(--text-muted)] truncate max-w-md">{job.novelUrl}</p>
                                                </div>
                                                <span className={cn("badge flex items-center gap-1", config.bg, config.color)}>
                                                    <config.icon className="w-3 h-3 animate-spin" />
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="mb-2">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Progress: {job.scrapedChapters} / {job.totalChapters} chapter</span>
                                                    <span className="font-medium">{progress}%</span>
                                                </div>
                                                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    Dimulai: {new Date(job.createdAt).toLocaleString("id-ID")}
                                                </span>
                                                <button onClick={() => handleCancel(job.id)} className="btn btn-secondary text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-1 text-sm">
                                                    ✕ Batalkan
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Job History */}
                    <div>
                        <h2 className="font-semibold mb-4">Riwayat Job ({completedJobs.length})</h2>
                        {completedJobs.length === 0 ? (
                            <div className="card p-8 text-center text-[var(--text-muted)]">Belum ada riwayat job</div>
                        ) : (
                            <div className="card overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[var(--bg-tertiary)]">
                                        <tr>
                                            <th className="text-left p-4 text-sm font-medium">URL</th>
                                            <th className="text-left p-4 text-sm font-medium hidden sm:table-cell">Chapter</th>
                                            <th className="text-left p-4 text-sm font-medium">Status</th>
                                            <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Waktu</th>
                                            <th className="text-right p-4 text-sm font-medium">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--bg-tertiary)]">
                                        {completedJobs.map((job) => {
                                            const config = statusConfig[job.status as keyof typeof statusConfig]
                                            return (
                                                <tr key={job.id} className="hover:bg-[var(--bg-tertiary)]/50">
                                                    <td className="p-4">
                                                        <p className="text-sm text-[var(--text-muted)] truncate max-w-xs">{job.novelUrl}</p>
                                                    </td>
                                                    <td className="p-4 hidden sm:table-cell">
                                                        <span className="text-sm">{job.scrapedChapters} / {job.totalChapters}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={cn("badge flex items-center gap-1 w-fit", config.bg, config.color)}>
                                                            <config.icon className="w-3 h-3" />
                                                            {config.label}
                                                        </span>
                                                        {job.error && <p className="text-xs text-red-500 mt-1 max-w-xs truncate">{job.error}</p>}
                                                    </td>
                                                    <td className="p-4 hidden md:table-cell">
                                                        <p className="text-sm">{new Date(job.createdAt).toLocaleDateString("id-ID")}</p>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleDelete(job.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors" title="Hapus Job">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
