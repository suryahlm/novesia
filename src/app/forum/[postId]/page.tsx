"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, Clock, Crown, Trash2, MessageCircle, Pin, Lock } from "lucide-react"

interface ForumPost {
    id: string
    title: string
    content: string
    views: number
    likes: number
    isPinned: boolean
    isLocked: boolean
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string | null
        image: string | null
        isVip: boolean
    }
    category: {
        id: string
        name: string
        slug: string
        icon: string | null
    }
}

export default function ForumPostPage() {
    const { postId } = useParams()
    const { data: session } = useSession()
    const router = useRouter()
    const [post, setPost] = useState<ForumPost | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        async function fetchPost() {
            try {
                const res = await fetch(`/api/forum/posts/${postId}`)
                if (res.ok) {
                    setPost(await res.json())
                } else {
                    router.push("/forum")
                }
            } catch (error) {
                console.error("Error fetching post:", error)
                router.push("/forum")
            } finally {
                setIsLoading(false)
            }
        }
        if (postId) fetchPost()
    }, [postId, router])

    const handleDelete = async () => {
        if (!confirm("Hapus post ini? Aksi tidak bisa dibatalkan.")) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/forum/posts/${postId}`, {
                method: "DELETE",
            })
            if (res.ok) {
                router.push("/forum")
            } else {
                alert("Gagal menghapus post")
            }
        } catch (error) {
            alert("Terjadi kesalahan")
        } finally {
            setIsDeleting(false)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (isLoading) {
        return (
            <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[var(--text-muted)]">Memuat...</p>
            </div>
        )
    }

    if (!post) return null

    const isOwner = session?.user?.id === post.user.id
    const isAdmin = (session?.user as any)?.role === "ADMIN"
    const canDelete = isOwner || isAdmin

    return (
        <div className="py-6 max-w-3xl mx-auto">
            {/* Back Button */}
            <Link
                href="/forum"
                className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Forum
            </Link>

            {/* Post Content */}
            <div className="card p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {post.user.image ? (
                            <img
                                src={post.user.image}
                                alt={post.user.name || "User"}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium text-lg">
                                {(post.user.name || "U")[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-1">
                                {post.user.isVip && <Crown className="w-4 h-4 text-[var(--color-accent)]" />}
                                <span className="font-medium">{post.user.name || "Anonim"}</span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)]">
                                {formatDate(post.createdAt)}
                            </p>
                        </div>
                    </div>

                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Hapus Post"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Category & Badges */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-sm">
                        {post.category.icon} {post.category.name}
                    </span>
                    {post.isPinned && (
                        <span className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-sm flex items-center gap-1">
                            <Pin className="w-3 h-3" /> Pinned
                        </span>
                    )}
                    {post.isLocked && (
                        <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-sm flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

                {/* Content */}
                <div className="prose prose-invert max-w-none mb-6 text-[var(--text-secondary)] whitespace-pre-wrap">
                    {post.content}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-[var(--bg-tertiary)] text-sm text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views} views
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Diupdate {formatDate(post.updatedAt)}
                    </span>
                </div>
            </div>

            {/* Replies Section Placeholder */}
            <div className="card p-6 mt-4">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5 text-[var(--color-primary)]" />
                    Balasan
                </h2>
                <p className="text-center text-[var(--text-muted)] py-8">
                    Fitur balasan akan segera hadir! 🚀
                </p>
            </div>
        </div>
    )
}
