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
    const [isLoading, setIsLoading] = useState(true)

    // Fetch jobs from API
    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/scraper/jobs")
            if (res.ok) {
                const data = await res.json()
                setJobs(data)
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchJobs()
        // Refresh every 10 seconds
        const interval = setInterval(fetchJobs, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUrl.trim()) {
            alert("Masukkan URL novel terlebih dahulu")
            return
        }

        setIsSubmitting(true)
        console.log("Starting scrape for:", newUrl)

        try {
            const res = await fetch("/api/scraper", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ novelUrl: newUrl }),
            })

            console.log("Scraper API response status:", res.status)
            const data = await res.json()
            console.log("Scraper API response:", data)

            if (res.ok) {
                alert(`✅ Job scraping dimulai!\nJob ID: ${data.jobId}\n\nProses berjalan di background. Refresh untuk melihat progress.`)
                setNewUrl("")
                fetchJobs()
            } else {
                alert(`❌ Error: ${data.error || "Gagal memulai scraping"}`)
            }
        } catch (error) {
            console.error("Scraper error:", error)
            alert(`❌ Terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus job ini?")) return

        try {
            const res = await fetch(`/api/scraper/jobs/${id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                fetchJobs()
            }
        } catch (error) {
            console.error("Failed to delete job:", error)
        }
    }

    const activeJobs = jobs.filter((job) => ["PENDING", "SCRAPING", "TRANSLATING"].includes(job.status))
    const completedJobs = jobs.filter((job) => ["COMPLETED", "FAILED"].includes(job.status))

    return (
        <div className="py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Scraper Control Panel</h1>
                <p className="text-[var(--text-secondary)]">
                    Kelola proses scraping dan terjemahan novel dari sumber eksternal
                </p>
            </div>

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
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary whitespace-nowrap"
                    >
                        {isSubmitting ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Mulai Scraping
                            </>
                        )}
                    </button>
                </form>
                <p className="text-sm text-[var(--text-muted)] mt-3">
                    ⚡ Paste URL novel dari sumber eksternal. Proses scraping dan translasi akan berjalan otomatis.
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
                                    const progress = job.totalChapters
                                        ? Math.round((job.scrapedChapters / job.totalChapters) * 100)
                                        : 0

                                    return (
                                        <div key={job.id} className="card p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-medium">
                                                        {job.novelId ? "Novel ID: " + job.novelId : "Fetching novel info..."}
                                                    </p>
                                                    <p className="text-sm text-[var(--text-muted)] truncate max-w-md">
                                                        {job.novelUrl}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "badge flex items-center gap-1",
                                                    config.bg,
                                                    config.color
                                                )}>
                                                    <config.icon className="w-3 h-3 animate-spin" />
                                                    {config.label}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-2">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Progress: {job.scrapedChapters} / {job.totalChapters} chapter</span>
                                                    <span className="font-medium">{progress}%</span>
                                                </div>
                                                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[var(--color-primary)] transition-all"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    Dimulai: {new Date(job.createdAt).toLocaleString("id-ID")}
                                                </span>
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
                            <div className="card p-8 text-center text-[var(--text-muted)]">
                                Belum ada riwayat job
                            </div>
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
                                                        <p className="text-sm text-[var(--text-muted)] truncate max-w-xs">
                                                            {job.novelUrl}
                                                        </p>
                                                    </td>
                                                    <td className="p-4 hidden sm:table-cell">
                                                        <span className="text-sm">
                                                            {job.scrapedChapters} / {job.totalChapters}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={cn(
                                                            "badge flex items-center gap-1 w-fit",
                                                            config.bg,
                                                            config.color
                                                        )}>
                                                            <config.icon className="w-3 h-3" />
                                                            {config.label}
                                                        </span>
                                                        {job.error && (
                                                            <p className="text-xs text-red-500 mt-1 max-w-xs truncate">
                                                                {job.error}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="p-4 hidden md:table-cell">
                                                        <p className="text-sm">
                                                            {new Date(job.createdAt).toLocaleDateString("id-ID")}
                                                        </p>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleDelete(job.id)}
                                                            className="btn btn-ghost text-sm text-red-500"
                                                        >
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
