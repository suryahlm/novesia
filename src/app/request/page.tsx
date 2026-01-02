"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
    BookPlus,
    Send,
    Clock,
    CheckCircle,
    XCircle,
    BookOpen,
    Loader2,
    LogIn,
    History,
} from "lucide-react"

interface NovelRequest {
    id: string
    title: string
    author: string | null
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"
    adminNote: string | null
    createdAt: string
}

const statusConfig = {
    PENDING: { label: "Menunggu", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    APPROVED: { label: "Disetujui", icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    REJECTED: { label: "Ditolak", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    COMPLETED: { label: "Selesai", icon: BookOpen, color: "text-green-500", bg: "bg-green-500/10" },
}

export default function RequestNovelPage() {
    const { data: session, status } = useSession()
    const [title, setTitle] = useState("")
    const [author, setAuthor] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [requests, setRequests] = useState<NovelRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (session) {
            fetchRequests()
        } else {
            setIsLoading(false)
        }
    }, [session])

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/novel-requests")
            if (res.ok) {
                const data = await res.json()
                setRequests(data)
            }
        } catch (error) {
            console.error("Error fetching requests:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (!title.trim()) {
            setError("Judul novel wajib diisi")
            return
        }

        setIsSubmitting(true)

        try {
            const res = await fetch("/api/novel-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), author: author.trim() }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Gagal mengirim request")
                return
            }

            setSuccess("Request novel berhasil dikirim!")
            setTitle("")
            setAuthor("")
            fetchRequests()
        } catch (error) {
            setError("Terjadi kesalahan, coba lagi")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (status === "loading" || isLoading) {
        return (
            <div className="pb-4 sm:py-8 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="pb-4 sm:py-8">
                <div className="max-w-2xl mx-auto text-center py-12">
                    <BookPlus className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Request Novel</h1>
                    <p className="text-[var(--text-muted)] mb-6">
                        Masuk untuk request novel yang ingin kamu baca
                    </p>
                    <Link href="/login?redirect=/request" className="btn btn-primary">
                        <LogIn className="w-4 h-4 mr-2" />
                        Masuk
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="pb-4 sm:py-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
                        <BookPlus className="w-7 h-7 text-[var(--color-primary)]" />
                        Request Novel
                    </h1>
                    <p className="text-sm sm:text-base text-[var(--text-muted)]">
                        Minta novel favorit kamu untuk ditambahkan ke Novesia
                    </p>
                </div>

                {/* Request Form */}
                <form onSubmit={handleSubmit} className="card p-4 sm:p-6 mb-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Judul Novel <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Contoh: Solo Leveling, The Beginning After The End"
                                className="input w-full"
                                maxLength={200}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Nama Penulis <span className="text-[var(--text-muted)]">(opsional)</span>
                            </label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Contoh: Chugong"
                                className="input w-full"
                                maxLength={100}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Kirim Request
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Request History */}
                <div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Riwayat Request ({requests.length})
                    </h2>

                    {requests.length === 0 ? (
                        <div className="card p-6 text-center text-[var(--text-muted)]">
                            Belum ada request novel
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => {
                                const config = statusConfig[req.status]
                                const StatusIcon = config.icon
                                return (
                                    <div key={req.id} className="card p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm sm:text-base truncate">
                                                    {req.title}
                                                </h3>
                                                {req.author && (
                                                    <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                                                        oleh {req.author}
                                                    </p>
                                                )}
                                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                                    {new Date(req.createdAt).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                                {req.adminNote && (
                                                    <p className="text-xs mt-2 p-2 bg-[var(--bg-tertiary)] rounded">
                                                        💬 {req.adminNote}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}
                                            >
                                                <StatusIcon className="w-3 h-3" />
                                                {config.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
