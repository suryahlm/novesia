"use client"

import { useState, useEffect } from "react"
import { CloudDownload, Check, Loader2, RefreshCw, BookOpen, AlertCircle } from "lucide-react"
import { getProxiedImageUrl } from "@/lib/image-utils"

interface R2Novel {
    id: number
    title: string
    slug: string
    coverUrl: string
    author: string
    synopsis: string
    status: string
    genres: string[]
    totalChapters: number
    isImported: boolean
}

export default function AdminImportPage() {
    const [novels, setNovels] = useState<R2Novel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [importing, setImporting] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({ total: 0, imported: 0 })

    const fetchNovels = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/admin/import")
            const data = await res.json()

            if (data.error && !data.novels) {
                setError(data.error)
                return
            }

            setNovels(data.novels || [])
            setStats({ total: data.total || 0, imported: data.imported || 0 })
        } catch (err) {
            setError("Gagal mengambil data dari R2")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNovels()
    }, [])

    const handleImport = async (novelId: number) => {
        setImporting(novelId)
        try {
            const res = await fetch("/api/admin/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ novelId }),
            })

            const data = await res.json()

            if (res.ok) {
                alert(`Berhasil import "${data.novel.title}" dengan ${data.chaptersImported} chapter!`)
                fetchNovels()
            } else {
                alert(data.error || "Gagal import")
            }
        } catch (err) {
            alert("Terjadi kesalahan saat import")
        } finally {
            setImporting(null)
        }
    }

    if (isLoading) {
        return (
            <div className="py-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--color-primary)]" />
                <p className="text-[var(--text-muted)]">Mengambil data dari R2...</p>
            </div>
        )
    }

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CloudDownload className="w-6 h-6 text-[var(--color-primary)]" />
                        Import dari R2
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Total: {stats.total} novel | Sudah import: {stats.imported}
                    </p>
                </div>
                <button
                    onClick={fetchNovels}
                    className="btn btn-secondary"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="card p-4 mb-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {novels.length === 0 ? (
                <div className="card p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                    <h3 className="text-lg font-medium mb-2">Tidak ada novel di R2</h3>
                    <p className="text-[var(--text-muted)]">
                        Pastikan file novels/index.json ada di R2 bucket
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {novels.map((novel) => (
                        <div key={novel.id} className="card overflow-hidden">
                            <div className="flex gap-4 p-4">
                                <img
                                    src={getProxiedImageUrl(novel.coverUrl) || novel.coverUrl}
                                    alt={novel.title}
                                    className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{novel.title}</h3>
                                    <p className="text-sm text-[var(--text-muted)] truncate">{novel.author}</p>
                                    <p className="text-sm mt-1">
                                        <span className="badge badge-secondary">{novel.totalChapters} chapter</span>
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {novel.genres.slice(0, 2).map((g, i) => (
                                            <span key={i} className="text-xs bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 pb-4">
                                {novel.isImported ? (
                                    <button disabled className="btn btn-secondary w-full cursor-not-allowed">
                                        <Check className="w-4 h-4 mr-2 text-green-500" />
                                        Sudah Import
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleImport(novel.id)}
                                        disabled={importing === novel.id}
                                        className="btn btn-primary w-full"
                                    >
                                        {importing === novel.id ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CloudDownload className="w-4 h-4 mr-2" />
                                        )}
                                        {importing === novel.id ? "Importing..." : "Import Novel"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
