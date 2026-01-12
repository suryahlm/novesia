"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Edit, Eye, BookOpen, FileText, Trash2, CheckSquare, Square, Loader2 } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { getProxiedImageUrl } from "@/lib/image-utils"

interface Novel {
    id: string
    title: string
    slug: string
    cover: string | null
    author: string | null
    status: string
    totalViews: number
    isPremium: boolean
    _count: { chapters: number }
    genres: { id: string; name: string }[]
}

function getStatusBadge(status: string) {
    switch (status) {
        case "COMPLETED":
            return "bg-green-500 text-white"
        case "ONGOING":
            return "badge-primary"
        case "HIATUS":
            return "bg-yellow-500 text-white"
        case "DROPPED":
            return "bg-red-500 text-white"
        default:
            return "badge-secondary"
    }
}

export default function NovelsTable({ novels }: { novels: Novel[] }) {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selected)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelected(newSelected)
    }

    const toggleSelectAll = () => {
        if (selected.size === novels.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(novels.map(n => n.id)))
        }
    }

    const handleBulkDelete = async () => {
        if (selected.size === 0) return

        const confirmed = confirm(`Hapus ${selected.size} novel yang dipilih? Semua chapter juga akan terhapus!`)
        if (!confirmed) return

        setIsDeleting(true)
        try {
            const ids = Array.from(selected)
            const response = await fetch("/api/novels/bulk-delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            })

            if (response.ok) {
                const data = await response.json()
                alert(`✅ ${data.deleted} novel berhasil dihapus!`)
                setSelected(new Set())
                router.refresh()
            } else {
                const error = await response.json()
                alert(`❌ Error: ${error.error}`)
            }
        } catch (error) {
            alert(`❌ Error: ${error}`)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSingleDelete = async (id: string, title: string) => {
        const confirmed = confirm(`Hapus novel "${title}"? Semua chapter juga akan terhapus!`)
        if (!confirmed) return

        try {
            const response = await fetch(`/api/novels/${id}`, { method: "DELETE" })
            if (response.ok) {
                alert("✅ Novel berhasil dihapus!")
                router.refresh()
            } else {
                const error = await response.json()
                alert(`❌ Error: ${error.error}`)
            }
        } catch (error) {
            alert(`❌ Error: ${error}`)
        }
    }

    return (
        <div>
            {/* Bulk Actions */}
            {selected.size > 0 && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
                    <span className="text-red-500 font-medium">
                        {selected.size} novel dipilih
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="btn bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        Hapus {selected.size} Novel
                    </button>
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--bg-tertiary)]">
                                <th className="p-4 w-12">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="p-1 hover:bg-[var(--bg-tertiary)] rounded"
                                    >
                                        {selected.size === novels.length && novels.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
                                        ) : (
                                            <Square className="w-5 h-5 text-[var(--text-muted)]" />
                                        )}
                                    </button>
                                </th>
                                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Novel</th>
                                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Author</th>
                                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Status</th>
                                <th className="text-center p-4 font-medium text-[var(--text-muted)]">Chapters</th>
                                <th className="text-center p-4 font-medium text-[var(--text-muted)]">Views</th>
                                <th className="text-center p-4 font-medium text-[var(--text-muted)]">Premium</th>
                                <th className="text-right p-4 font-medium text-[var(--text-muted)]">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--bg-tertiary)]">
                            {novels.map((novel) => (
                                <tr
                                    key={novel.id}
                                    className={`hover:bg-[var(--bg-secondary)] transition-colors ${selected.has(novel.id) ? 'bg-[var(--color-primary)]/5' : ''}`}
                                >
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleSelect(novel.id)}
                                            className="p-1 hover:bg-[var(--bg-tertiary)] rounded"
                                        >
                                            {selected.has(novel.id) ? (
                                                <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
                                            ) : (
                                                <Square className="w-5 h-5 text-[var(--text-muted)]" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4 min-w-[200px]">
                                        <div className="flex items-center gap-3">
                                            {novel.cover ? (
                                                <img
                                                    src={getProxiedImageUrl(novel.cover) || novel.cover}
                                                    alt={novel.title}
                                                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-16 bg-[var(--bg-tertiary)] rounded flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="w-6 h-6 text-[var(--text-muted)]" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium truncate max-w-[150px]">{novel.title}</p>
                                                <p className="text-sm text-[var(--text-muted)] truncate max-w-[150px]">
                                                    {novel.genres.slice(0, 2).map(g => g.name).join(", ")}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-[var(--text-secondary)]">
                                        {novel.author || "-"}
                                    </td>
                                    <td className="p-4">
                                        <span className={`badge ${getStatusBadge(novel.status)}`}>
                                            {novel.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {novel._count.chapters}
                                    </td>
                                    <td className="p-4 text-center">
                                        {formatNumber(novel.totalViews)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {novel.isPremium ? (
                                            <span className="badge badge-premium">Premium</span>
                                        ) : (
                                            <span className="text-[var(--text-muted)]">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/admin/novels/${novel.id}/chapters/new`}
                                                className="p-2 hover:bg-green-500/10 text-green-600 rounded-lg transition-colors"
                                                title="Tambah Chapter"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/novel/${novel.slug}`}
                                                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                title="Lihat"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/admin/novels/${novel.id}/edit`}
                                                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleSingleDelete(novel.id, novel.title)}
                                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
