"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Upload,
    Image as ImageIcon,
    Save,
    Plus,
    X,
} from "lucide-react"

const genres = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy",
    "Harem", "Historical", "Horror", "Martial Arts", "Mature",
    "Mecha", "Mystery", "Psychological", "Romance", "School Life",
    "Sci-Fi", "Seinen", "Shoujo", "Shounen", "Slice of Life",
    "Sports", "Supernatural", "Tragedy", "Wuxia", "Xianxia", "Xuanhuan"
]

export default function NewNovelPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        synopsis: "",
        status: "ONGOING",
        isPremium: false,
    })
    const [coverPreview, setCoverPreview] = useState<string | null>(null)

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

        // TODO: Submit to API
        const data = {
            ...formData,
            genres: selectedGenres,
        }
        console.log("Submitting:", data)

        setTimeout(() => {
            setIsSubmitting(false)
            // Redirect to novel list
        }, 1500)
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
