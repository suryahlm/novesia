"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Loader2 } from "lucide-react"

interface ForumCategory {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
}

export default function NewForumPostPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [categories, setCategories] = useState<ForumCategory[]>([])
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?redirect=/forum/new")
        }
    }, [status, router])

    useEffect(() => {
        async function fetchCategories() {
            const res = await fetch("/api/forum/categories")
            if (res.ok) {
                const data = await res.json()
                setCategories(data)
                if (data.length > 0) {
                    setCategoryId(data[0].id)
                }
            }
        }
        fetchCategories()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!title.trim()) {
            setError("Judul tidak boleh kosong")
            return
        }
        if (!content.trim()) {
            setError("Konten tidak boleh kosong")
            return
        }
        if (!categoryId) {
            setError("Pilih kategori")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/forum/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, categoryId }),
            })

            if (res.ok) {
                const post = await res.json()
                router.push(`/forum/${post.id}`)
            } else {
                const data = await res.json()
                setError(data.error || "Gagal membuat post")
            }
        } catch (err) {
            setError("Terjadi kesalahan")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (status === "loading") {
        return (
            <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        )
    }

    if (!session) return null

    return (
        <div className="py-6 max-w-2xl mx-auto">
            {/* Back Button */}
            <Link
                href="/forum"
                className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Forum
            </Link>

            <div className="card p-6">
                <h1 className="text-2xl font-bold mb-6">Buat Post Baru</h1>

                {error && (
                    <div className="p-4 mb-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Kategori</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="input w-full"
                            required
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Judul</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Tulis judul post..."
                            className="input w-full"
                            maxLength={200}
                            required
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">{title.length}/200</p>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Konten</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Tulis isi post kamu di sini..."
                            className="input w-full min-h-[200px] resize-y"
                            required
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <Link href="/forum" className="btn btn-secondary flex-1">
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary flex-1"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-1" />
                                    Posting
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
