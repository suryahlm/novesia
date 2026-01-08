"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { MessageCircle, Plus, Eye, Clock, ChevronRight, Search, Pin, Lock, Crown } from "lucide-react"

interface ForumCategory {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    _count: { posts: number }
}

interface ForumPost {
    id: string
    title: string
    content: string
    views: number
    likes: number
    isPinned: boolean
    isLocked: boolean
    createdAt: string
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

export default function ForumPage() {
    const { data: session } = useSession()
    const [categories, setCategories] = useState<ForumCategory[]>([])
    const [posts, setPosts] = useState<ForumPost[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        async function fetchData() {
            try {
                const [catRes, postsRes] = await Promise.all([
                    fetch("/api/forum/categories"),
                    fetch("/api/forum/posts"),
                ])

                if (catRes.ok) {
                    setCategories(await catRes.json())
                }
                if (postsRes.ok) {
                    const data = await postsRes.json()
                    setPosts(data.posts || [])
                }
            } catch (error) {
                console.error("Error fetching forum data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const fetchPosts = async (categoryId: string | null) => {
        setIsLoading(true)
        try {
            const url = categoryId
                ? `/api/forum/posts?categoryId=${categoryId}`
                : "/api/forum/posts"
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setPosts(data.posts || [])
            }
        } catch (error) {
            console.error("Error fetching posts:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCategoryChange = (categoryId: string | null) => {
        setSelectedCategory(categoryId)
        fetchPosts(categoryId)
    }

    const filteredPosts = searchQuery
        ? posts.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : posts

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="py-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <MessageCircle className="w-8 h-8 text-[var(--color-primary)]" />
                        Forum Komunitas
                    </h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        Diskusi, berbagi, dan terhubung dengan pembaca lain
                    </p>
                </div>
                {session && (
                    <Link href="/forum/new" className="btn btn-primary">
                        <Plus className="w-5 h-5 mr-1" />
                        <span className="hidden sm:inline">Buat Post</span>
                    </Link>
                )}
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Cari di forum..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                <button
                    onClick={() => handleCategoryChange(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === null
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                        }`}
                >
                    Semua
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${selectedCategory === cat.id
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                            }`}
                    >
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                        <span className="text-xs opacity-70">({cat._count.posts})</span>
                    </button>
                ))}
            </div>

            {/* Posts List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">Memuat...</p>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="card p-12 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                    <h3 className="text-lg font-medium mb-2">Belum ada post</h3>
                    <p className="text-[var(--text-muted)] mb-4">
                        {session ? "Jadilah yang pertama memulai diskusi!" : "Login untuk membuat post pertama"}
                    </p>
                    {session && (
                        <Link href="/forum/new" className="btn btn-primary">
                            <Plus className="w-5 h-5 mr-1" />
                            Buat Post
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPosts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/forum/${post.id}`}
                            className="card p-4 block hover:bg-[var(--bg-secondary)] transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                {/* Author Avatar */}
                                {post.user.image ? (
                                    <img
                                        src={post.user.image}
                                        alt={post.user.name || "User"}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                                        {(post.user.name || "U")[0].toUpperCase()}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        {post.isPinned && (
                                            <Pin className="w-4 h-4 text-[var(--color-primary)]" />
                                        )}
                                        {post.isLocked && (
                                            <Lock className="w-4 h-4 text-orange-500" />
                                        )}
                                        <h3 className="font-medium group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                                            {post.title}
                                        </h3>
                                    </div>

                                    <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
                                        {post.content}
                                    </p>

                                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                        <span className="flex items-center gap-1">
                                            {post.user.isVip && <Crown className="w-3 h-3 text-[var(--color-accent)]" />}
                                            {post.user.name || "Anonim"}
                                        </span>
                                        <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full">
                                            {post.category.icon} {post.category.name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {post.views}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
