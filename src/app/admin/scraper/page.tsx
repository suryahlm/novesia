"use client"

import { useState } from "react"
import {
    Download,
    Play,
    Pause,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    Link as LinkIcon,
    Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Demo data - akan diganti dengan data dari database
const scrapeJobs = [
    {
        id: "1",
        novelUrl: "https://www.asianovel.net/the-beginning-after-the-end",
        novelTitle: "The Beginning After The End",
        status: "COMPLETED",
        totalChapters: 450,
        scrapedChapters: 450,
        createdAt: "2024-01-01 10:30",
        completedAt: "2024-01-01 12:45",
    },
    {
        id: "2",
        novelUrl: "https://www.asianovel.net/lord-of-mysteries",
        novelTitle: "Lord of Mysteries",
        status: "TRANSLATING",
        totalChapters: 1432,
        scrapedChapters: 890,
        createdAt: "2024-01-02 08:00",
    },
    {
        id: "3",
        novelUrl: "https://www.asianovel.net/solo-leveling",
        novelTitle: "Solo Leveling",
        status: "SCRAPING",
        totalChapters: 270,
        scrapedChapters: 120,
        createdAt: "2024-01-02 14:00",
    },
    {
        id: "4",
        novelUrl: "https://www.asianovel.net/invalid-novel",
        novelTitle: null,
        status: "FAILED",
        totalChapters: 0,
        scrapedChapters: 0,
        createdAt: "2024-01-02 15:30",
        error: "Failed to fetch novel info: timeout",
    },
]

const statusConfig = {
    PENDING: { icon: Clock, color: "text-gray-500", bg: "bg-gray-100", label: "Menunggu" },
    SCRAPING: { icon: Download, color: "text-blue-500", bg: "bg-blue-100", label: "Scraping" },
    TRANSLATING: { icon: RefreshCw, color: "text-yellow-500", bg: "bg-yellow-100", label: "Translating" },
    COMPLETED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100", label: "Selesai" },
    FAILED: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100", label: "Gagal" },
}

export default function ScraperPage() {
    const [newUrl, setNewUrl] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUrl.trim()) return

        setIsSubmitting(true)
        // TODO: Call API to create scrape job
        setTimeout(() => {
            setIsSubmitting(false)
            setNewUrl("")
        }, 1500)
    }

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
                            className="input pl-10"
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
                    ⚡ Paste URL novel dari AsianNovel.net. Proses scraping dan translasi akan berjalan otomatis.
                </p>
            </div>

            {/* Active Jobs */}
            <div className="mb-6">
                <h2 className="font-semibold mb-4">Job Aktif</h2>
                <div className="grid gap-4">
                    {scrapeJobs
                        .filter((job) => ["PENDING", "SCRAPING", "TRANSLATING"].includes(job.status))
                        .map((job) => {
                            const config = statusConfig[job.status as keyof typeof statusConfig]
                            const progress = job.totalChapters
                                ? Math.round((job.scrapedChapters / job.totalChapters) * 100)
                                : 0

                            return (
                                <div key={job.id} className="card p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-medium">
                                                {job.novelTitle || "Fetching novel info..."}
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
                                            Dimulai: {job.createdAt}
                                        </span>
                                        <button className="btn btn-ghost text-sm text-red-500">
                                            <Pause className="w-4 h-4 mr-1" />
                                            Pause
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>

            {/* Job History */}
            <div>
                <h2 className="font-semibold mb-4">Riwayat Job</h2>
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium">Novel</th>
                                <th className="text-left p-4 text-sm font-medium hidden sm:table-cell">Chapter</th>
                                <th className="text-left p-4 text-sm font-medium">Status</th>
                                <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Waktu</th>
                                <th className="text-right p-4 text-sm font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--bg-tertiary)]">
                            {scrapeJobs.map((job) => {
                                const config = statusConfig[job.status as keyof typeof statusConfig]
                                return (
                                    <tr key={job.id} className="hover:bg-[var(--bg-tertiary)]/50">
                                        <td className="p-4">
                                            <p className="font-medium line-clamp-1">
                                                {job.novelTitle || "—"}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">
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
                                            <p className="text-sm">{job.createdAt}</p>
                                            {job.completedAt && (
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    Selesai: {job.completedAt}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {job.status === "FAILED" && (
                                                    <button className="btn btn-ghost text-sm">
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button className="btn btn-ghost text-sm text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
