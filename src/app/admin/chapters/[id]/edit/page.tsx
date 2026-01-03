"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Coins } from "lucide-react"

interface Chapter {
    id: string
    novelId: string
    chapterNumber: number
    title: string
    contentTranslated: string
    isPremium: boolean
    coinCost: number
    novel: {
        title: string
    }
}

export default function EditChapterPage() {
    const router = useRouter()
    const params = useParams()
    const chapterId = params.id as string

    const [chapter, setChapter] = useState<Chapter | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [formData, setFormData] = useState({
        chapterNumber: 1,
        title: "",
        content: "",
        isPremium: false,
        coinCost: 5,
    })

    useEffect(() => {
        fetchChapter()
    }, [chapterId])

    const fetchChapter = async () => {
        try {
            const res = await fetch(`/api/chapters/${chapterId}`)
            if (res.ok) {
                const data = await res.json()
                setChapter(data)
                setFormData({
                    chapterNumber: data.chapterNumber,
                    title: data.title,
                    content: data.contentTranslated || "",
                    isPremium: data.isPremium,
                    coinCost: data.coinCost || 5,
                })
            } else {
                setError("Chapter tidak ditemukan")
            }
        } catch (err) {
            setError("Gagal memuat data chapter")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")
        setSuccess("")

        try {
            const res = await fetch(`/api/chapters/${chapterId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chapterNumber: formData.chapterNumber,
                    title: formData.title,
                    contentTranslated: formData.content,
                    isPremium: formData.isPremium,
                    coinCost: formData.coinCost,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Gagal menyimpan chapter")
            }

            setSuccess("Chapter berhasil disimpan!")
            setTimeout(() => {
                router.push("/admin/chapters")
                router.refresh()
            }, 1000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    if (!chapter) {
        return (
            <div className="py-12 text-center">
                <p className="text-red-500 mb-4">{error || "Chapter tidak ditemukan"}</p>
                <Link href="/admin/chapters" className="btn btn-secondary">
                    Kembali
                </Link>
            </div>
        )
    }

    return (
        <div className="py-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/admin/chapters"
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Edit Chapter</h1>
                    <p className="text-[var(--text-secondary)]">
                        {chapter.novel.title} - Chapter {chapter.chapterNumber}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Chapter Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Nomor Chapter
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.chapterNumber}
                            onChange={(e) => setFormData({ ...formData, chapterNumber: parseInt(e.target.value) || 1 })}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Judul Chapter
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input"
                            required
                        />
                    </div>
                </div>

                {/* Premium Settings */}
                <div className="card p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isPremium"
                                checked={formData.isPremium}
                                onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <label htmlFor="isPremium" className="text-sm font-medium">
                                Chapter Premium
                            </label>
                        </div>
                        {formData.isPremium && (
                            <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-amber-500" />
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.coinCost}
                                    onChange={(e) => setFormData({ ...formData, coinCost: parseInt(e.target.value) || 5 })}
                                    className="input w-20 text-center"
                                />
                                <span className="text-sm text-[var(--text-muted)]">koin</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Konten Chapter
                    </label>
                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Tulis konten chapter..."
                        className="input min-h-[400px] resize-y font-mono text-sm leading-relaxed"
                        required
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        {formData.content.split(/\s+/).filter(Boolean).length} kata
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
                        {success}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--bg-tertiary)]">
                    <Link href="/admin/chapters" className="btn btn-secondary">
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
