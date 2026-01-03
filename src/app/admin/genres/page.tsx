"use client"

import { useState, useEffect } from "react"
import { Tag, Save, Loader2 } from "lucide-react"

interface Genre {
    id: string
    name: string
    slug: string
    icon: string | null
    _count: { novels: number }
}

const defaultIcons = [
    "⚔️", "❤️", "✨", "🌾", "🚀", "👻", "🔍", "🌸",
    "😂", "🎭", "🏫", "⚡", "🌏", "💀", "🎯", "🐉",
    "👑", "🗡️", "💫", "🌙", "🔮", "🎪", "🎠", "🌈"
]

export default function AdminGenresPage() {
    const [genres, setGenres] = useState<Genre[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)

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

    const updateGenreIcon = async (genreId: string, icon: string) => {
        setSavingId(genreId)
        try {
            const res = await fetch(`/api/admin/genres/${genreId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ icon }),
            })

            if (res.ok) {
                setGenres(prev =>
                    prev.map(g => g.id === genreId ? { ...g, icon } : g)
                )
                setEditingId(null)
            }
        } catch (error) {
            console.error("Error updating genre:", error)
        } finally {
            setSavingId(null)
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
            </div>

            {/* Genre Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {genres.map((genre) => (
                    <div key={genre.id} className="card p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">{genre.icon || "📖"}</span>
                            <div>
                                <h3 className="font-semibold">{genre.name}</h3>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {genre._count.novels} novel
                                </p>
                            </div>
                        </div>

                        {editingId === genre.id ? (
                            <div>
                                <p className="text-sm text-[var(--text-muted)] mb-2">
                                    Pilih icon:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {defaultIcons.map((icon) => (
                                        <button
                                            key={icon}
                                            onClick={() => updateGenreIcon(genre.id, icon)}
                                            disabled={savingId === genre.id}
                                            className={`w-10 h-10 text-xl rounded-lg border hover:bg-[var(--bg-tertiary)] transition-colors ${genre.icon === icon ? "border-[var(--color-primary)] bg-[var(--bg-tertiary)]" : "border-[var(--bg-tertiary)]"
                                                }`}
                                        >
                                            {savingId === genre.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : (
                                                icon
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="mt-2 text-sm text-[var(--text-muted)] hover:text-[var(--color-primary)]"
                                >
                                    Batal
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditingId(genre.id)}
                                className="btn btn-secondary w-full justify-center"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Ganti Icon
                            </button>
                        )}
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
