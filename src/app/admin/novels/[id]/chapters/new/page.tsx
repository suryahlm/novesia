"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Save,
    AlertCircle,
    Loader2,
    Coins,
} from "lucide-react"

interface PageProps {
    params: Promise<{ id: string }>
}

export default function NewChapterPage({ params }: PageProps) {
    const router = useRouter()
    const [novelId, setNovelId] = useState<string>("")
    const [novelTitle, setNovelTitle] = useState<string>("")
    const [nextChapterNumber, setNextChapterNumber] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        chapterNumber: 1,
        title: "",
        content: "",
        isPremium: false,
        coinCost: 5,
    })

    useEffect(() => {
        async function loadNovel() {
            const { id } = await params
            setNovelId(id)

            try {
                // Get novel info
                const novelRes = await fetch(`/api/novels/${id}`)
                if (!novelRes.ok) throw new Error("Novel not found")
                const novel = await novelRes.json()
                setNovelTitle(novel.title)

                // Get next chapter number
                const nextNum = (novel._count?.chapters || 0) + 1
                setNextChapterNumber(nextNum)
                setFormData(prev => ({ ...prev, chapterNumber: nextNum }))
            } catch (err) {
                setError("Gagal memuat data novel")
            } finally {
                setIsLoading(false)
            }
        }
        loadNovel()
    }, [params])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")

        try {
            const response = await fetch("/api/chapters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    novelId,
                    ...formData,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Gagal menyimpan chapter")
            }

            router.push("/admin/chapters")
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="py-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
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
                    <h1 className="text-2xl font-bold">Tambah Chapter</h1>
                    <p className="text-[var(--text-secondary)]">
                        {novelTitle}
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 mb-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chapter Number */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Nomor Chapter <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.chapterNumber}
                            onChange={(e) => setFormData({ ...formData, chapterNumber: parseInt(e.target.value) || 1 })}
                            className="input"
                            required
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            Disarankan: {nextChapterNumber}
                        </p>
                    </div>

                    {/* Chapter Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Judul Chapter <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Masukkan judul chapter"
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
                                Chapter Premium (Butuh Koin)
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
                        Konten Chapter <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Tulis konten chapter di sini..."
                        className="input min-h-[400px] resize-y font-mono text-sm"
                        required
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        {formData.content.split(/\s+/).filter(Boolean).length} kata
                    </p>
                </div>

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
                                Simpan Chapter
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
