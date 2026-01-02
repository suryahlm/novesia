"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Upload,
    Save,
    X,
    AlertCircle,
    Loader2,
} from "lucide-react"

const genres = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy",
    "Harem", "Historical", "Horror", "Martial Arts", "Mature",
    "Mecha", "Mystery", "Psychological", "Romance", "School Life",
    "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life",
    "Sports", "Supernatural", "Tragedy", "Wuxia", "Xianxia", "Xuanhuan"
]

interface PageProps {
    params: Promise<{ id: string }>
}

export default function EditNovelPage({ params }: PageProps) {
    const router = useRouter()
    const [novelId, setNovelId] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        synopsis: "",
        status: "ONGOING",
        isPremium: false,
        freeChapterLimit: 0,
        coinCost: 5,
    })
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)

    useEffect(() => {
        async function loadNovel() {
            const { id } = await params
            setNovelId(id)

            try {
                const response = await fetch(`/api/novels/${id}`)
                if (!response.ok) throw new Error("Novel not found")

                const novel = await response.json()
                setFormData({
                    title: novel.title || "",
                    author: novel.author || "",
                    synopsis: novel.synopsis || "",
                    status: novel.status || "ONGOING",
                    isPremium: novel.isPremium || false,
                    freeChapterLimit: novel.freeChapterLimit || 0,
                    coinCost: novel.coinCost || 5,
                })
                setSelectedGenres(novel.genres?.map((g: { name: string }) => g.name) || [])
                setCoverPreview(novel.cover)
            } catch (err) {
                setError("Gagal memuat data novel")
            } finally {
                setIsLoading(false)
            }
        }
        loadNovel()
    }, [params])

    const handleGenreToggle = (genre: string) => {
        setSelectedGenres((prev) =>
            prev.includes(genre)
                ? prev.filter((g) => g !== genre)
                : [...prev, genre]
        )
    }

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCoverFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setCoverPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")

        try {
            // Upload cover if new file selected
            let coverUrl = coverPreview
            if (coverFile) {
                const uploadFormData = new FormData()
                uploadFormData.append("file", coverFile)
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                })
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json()
                    coverUrl = uploadData.url
                }
            }

            // Update novel
            const response = await fetch(`/api/novels/${novelId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    genres: selectedGenres,
                    cover: coverUrl,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Gagal menyimpan novel")
            }

            router.push("/admin/novels")
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
                    href="/admin/novels"
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Edit Novel</h1>
                    <p className="text-[var(--text-secondary)]">
                        Perbarui informasi novel
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cover Upload */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium mb-2">Cover Novel</label>
                        <div className="card overflow-hidden">
                            <label className="block cursor-pointer">
                                {coverPreview ? (
                                    <div className="relative aspect-book group">
                                        <img
                                            src={coverPreview}
                                            alt="Cover preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-sm">Ganti Gambar</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-book bg-[var(--bg-tertiary)] flex flex-col items-center justify-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors">
                                        <Upload className="w-10 h-10 text-[var(--text-muted)]" />
                                        <div className="text-center">
                                            <p className="text-sm font-medium">Upload Cover</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                PNG, JPG (max 2MB)
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="md:col-span-2 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Judul Novel <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input"
                                required
                            />
                        </div>

                        {/* Author */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Author</label>
                            <input
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                className="input"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="input"
                            >
                                <option value="ONGOING">Ongoing</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="HIATUS">Hiatus</option>
                                <option value="DROPPED">Dropped</option>
                            </select>
                        </div>

                        {/* Premium Toggle */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isPremium"
                                    checked={formData.isPremium}
                                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <label htmlFor="isPremium" className="text-sm font-medium">
                                    Novel Premium (VIP Only)
                                </label>
                            </div>

                            {formData.isPremium && (
                                <div className="ml-7 p-4 bg-[var(--bg-tertiary)] rounded-lg space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Chapter Gratis
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-[var(--text-muted)]">1 -</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.freeChapterLimit}
                                                    onChange={(e) => setFormData({ ...formData, freeChapterLimit: parseInt(e.target.value) || 0 })}
                                                    className="input w-20 text-center"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Harga per Chapter
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.coinCost}
                                                    onChange={(e) => setFormData({ ...formData, coinCost: parseInt(e.target.value) || 5 })}
                                                    className="input w-20 text-center"
                                                />
                                                <span className="text-sm text-[var(--text-muted)]">koin</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Synopsis */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Sinopsis <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.synopsis}
                        onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                        className="input min-h-[150px] resize-y"
                        required
                    />
                </div>

                {/* Genres */}
                <div>
                    <label className="block text-sm font-medium mb-2">Genre</label>
                    <div className="flex flex-wrap gap-2">
                        {genres.map((genre) => (
                            <button
                                key={genre}
                                type="button"
                                onClick={() => handleGenreToggle(genre)}
                                className={`badge transition-colors ${selectedGenres.includes(genre)
                                    ? "badge-primary"
                                    : "badge-secondary hover:bg-[var(--bg-secondary)]"
                                    }`}
                            >
                                {selectedGenres.includes(genre) && (
                                    <X className="w-3 h-3 mr-1" />
                                )}
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--bg-tertiary)]">
                    <Link href="/admin/novels" className="btn btn-secondary">
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
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
