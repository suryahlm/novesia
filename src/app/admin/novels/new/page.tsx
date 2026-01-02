"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Upload,
    Image as ImageIcon,
    Save,
    Plus,
    X,
    AlertCircle,
} from "lucide-react"

const genres = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy",
    "Harem", "Historical", "Horror", "Martial Arts", "Mature",
    "Mecha", "Mystery", "Psychological", "Romance", "School Life",
    "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life",
    "Sports", "Supernatural", "Tragedy", "Wuxia", "Xianxia", "Xuanhuan"
]

export default function NewNovelPage() {
    const router = useRouter()
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
            // Upload cover if exists
            let coverUrl = null
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

            // Create novel
            const response = await fetch("/api/novels", {
                method: "POST",
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

            // Redirect to novel list
            router.push("/admin/novels")
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan")
        } finally {
            setIsSubmitting(false)
        }
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
                    <h1 className="text-2xl font-bold">Tambah Novel Baru</h1>
                    <p className="text-[var(--text-secondary)]">
                        Input novel secara manual ke database
                    </p>
                </div>
            </div>

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
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                            Ratio disarankan: 2:3 (portrait)
                        </p>
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
                                placeholder="Masukkan judul novel"
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
                                placeholder="Nama penulis"
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
                                    className="w-4 h-4 rounded border-[var(--text-muted)]"
                                />
                                <label htmlFor="isPremium" className="text-sm font-medium">
                                    Novel Premium (VIP Only)
                                </label>
                            </div>

                            {/* Premium Chapter Settings */}
                            {formData.isPremium && (
                                <div className="ml-7 p-4 bg-[var(--bg-tertiary)] rounded-lg space-y-4">
                                    <p className="text-xs text-[var(--text-muted)] mb-3">
                                        Atur chapter mana yang gratis dan mana yang premium
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Free Chapter Limit */}
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
                                                    placeholder="59"
                                                />
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                Chapter setelahnya = Premium
                                            </p>
                                        </div>

                                        {/* Coin Cost */}
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
                                                    placeholder="5"
                                                />
                                                <span className="text-sm text-[var(--text-muted)]">koin</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                Untuk unlock chapter premium
                                            </p>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    {formData.freeChapterLimit > 0 && (
                                        <div className="text-sm p-3 bg-[var(--bg-secondary)] rounded-lg">
                                            <p className="font-medium mb-1">📖 Preview:</p>
                                            <p className="text-[var(--text-muted)]">
                                                • Chapter 1-{formData.freeChapterLimit}: <span className="text-green-500">Gratis</span>
                                            </p>
                                            <p className="text-[var(--text-muted)]">
                                                • Chapter {formData.freeChapterLimit + 1}+: <span className="text-amber-500">{formData.coinCost} koin/chapter</span>
                                            </p>
                                        </div>
                                    )}
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
                        placeholder="Tulis sinopsis novel..."
                        className="input min-h-[150px] resize-y"
                        required
                    />
                </div>

                {/* Genres */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Genre <span className="text-[var(--text-muted)]">(pilih minimal 1)</span>
                    </label>
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
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Novel
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
