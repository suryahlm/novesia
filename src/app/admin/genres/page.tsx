"use client"

import { useState, useEffect, useRef } from "react"
import { Tag, Upload, Loader2, Image as ImageIcon, X, Plus } from "lucide-react"
import { getProxiedImageUrl } from "@/lib/image-utils"

interface Genre {
    id: string
    name: string
    slug: string
    icon: string | null
    _count: { novels: number }
}

export default function AdminGenresPage() {
    const [genres, setGenres] = useState<Genre[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSeeding, setIsSeeding] = useState(false)
    const [savingId, setSavingId] = useState<string | null>(null)
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

    useEffect(() => {
        fetchGenres()
    }, [])

    const fetchGenres = async () => {
        try {
            const res = await fetch("/api/admin/genres")
            const data = await res.json()
            setGenres(data)
        } catch (error) {
            console.error("Error fetching genres:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileSelect = async (genreId: string, file: File) => {
        setSavingId(genreId)
        try {
            // Upload file first
            const formData = new FormData()
            formData.append("file", file)

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!uploadRes.ok) {
                throw new Error("Upload failed")
            }

            const { url } = await uploadRes.json()

            // Update genre with new icon URL
            const res = await fetch(`/api/admin/genres/${genreId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ icon: url }),
            })

            if (res.ok) {
                setGenres(prev =>
                    prev.map(g => g.id === genreId ? { ...g, icon: url } : g)
                )
            }
        } catch (error) {
            console.error("Error updating genre:", error)
            alert("Gagal mengupload gambar")
        } finally {
            setSavingId(null)
        }
    }

    const removeIcon = async (genreId: string) => {
        setSavingId(genreId)
        try {
            const res = await fetch(`/api/admin/genres/${genreId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ icon: null }),
            })

            if (res.ok) {
                setGenres(prev =>
                    prev.map(g => g.id === genreId ? { ...g, icon: null } : g)
                )
            }
        } catch (error) {
            console.error("Error removing icon:", error)
        } finally {
            setSavingId(null)
        }
    }

    const seedGenres = async () => {
        setIsSeeding(true)
        try {
            const res = await fetch("/api/admin/genres/seed", {
                method: "POST",
            })
            const data = await res.json()

            if (res.ok) {
                if (data.added > 0) {
                    alert(`Berhasil menambahkan ${data.added} genre baru!`)
                    fetchGenres()
                } else {
                    alert("Semua genre sudah ada")
                }
            }
        } catch (error) {
            console.error("Error seeding genres:", error)
            alert("Gagal menambahkan genre")
        } finally {
            setIsSeeding(false)
        }
    }

    const isImageUrl = (icon: string | null) => {
        return icon && (icon.startsWith("http") || icon.startsWith("/"))
    }

    if (isLoading) {
        return (
            <div className="py-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    return (
        <div className="py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Tag className="w-6 h-6 text-[var(--color-primary)]" />
                    <div>
                        <h1 className="text-2xl font-bold">Kelola Genre</h1>
                        <p className="text-[var(--text-secondary)]">
                            Total: {genres.length} genre
                        </p>
                    </div>
                </div>
                <button
                    onClick={seedGenres}
                    disabled={isSeeding}
                    className="btn btn-primary"
                >
                    {isSeeding ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Plus className="w-4 h-4 mr-2" />
                    )}
                    Tambah Semua Genre
                </button>
            </div>

            {/* Genre Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {genres.map((genre) => (
                    <div key={genre.id} className="card p-4">
                        <div className="flex items-center gap-3 mb-4">
                            {/* Icon Preview */}
                            <div className="w-16 h-16 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden">
                                {isImageUrl(genre.icon) ? (
                                    <img
                                        src={getProxiedImageUrl(genre.icon) || genre.icon!}
                                        alt={genre.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : genre.icon ? (
                                    <span className="text-3xl">{genre.icon}</span>
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-[var(--text-muted)]" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold">{genre.name}</h3>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {genre._count.novels} novel
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={(el) => { fileInputRefs.current[genre.id] = el }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        handleFileSelect(genre.id, file)
                                        e.target.value = ""
                                    }
                                }}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRefs.current[genre.id]?.click()}
                                disabled={savingId === genre.id}
                                className="btn btn-primary flex-1 justify-center"
                            >
                                {savingId === genre.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Gambar
                                    </>
                                )}
                            </button>
                            {genre.icon && (
                                <button
                                    onClick={() => removeIcon(genre.id)}
                                    disabled={savingId === genre.id}
                                    className="btn btn-secondary px-3"
                                    title="Hapus icon"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {genres.length === 0 && (
                <div className="card p-12 text-center">
                    <Tag className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Belum ada genre</h3>
                    <p className="text-[var(--text-muted)]">
                        Genre akan otomatis dibuat saat menambahkan novel
                    </p>
                </div>
            )}
        </div>
    )
}
