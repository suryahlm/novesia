"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MessageSquare, Heart, Send, Loader2 } from "lucide-react"
import Link from "next/link"

interface Comment {
    id: string
    content: string
    createdAt: string
    likes: number
    user: {
        name: string | null
        image: string | null
    }
}

interface CommentSectionProps {
    novelId: string
}

export default function CommentSection({ novelId }: CommentSectionProps) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        async function fetchComments() {
            try {
                const response = await fetch(`/api/comments?novelId=${novelId}`)
                if (response.ok) {
                    const data = await response.json()
                    // API returns { comments, totalCount } - extract the array
                    setComments(Array.isArray(data) ? data : (data.comments || []))
                }
            } catch (error) {
                console.error("Error fetching comments:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchComments()
    }, [novelId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !session) return

        setIsSubmitting(true)
        try {
            const response = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ novelId, content: newComment }),
            })

            if (response.ok) {
                const comment = await response.json()
                setComments([comment, ...comments])
                setNewComment("")
            }
        } catch (error) {
            console.error("Error posting comment:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 1) return "Baru saja"
        if (minutes < 60) return `${minutes} menit lalu`
        if (hours < 24) return `${hours} jam lalu`
        if (days < 7) return `${days} hari lalu`
        return date.toLocaleDateString("id-ID")
    }

    return (
        <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--color-primary)]" />
                Komentar ({comments.length})
            </h2>

            {/* Comment Input */}
            <div className="card p-4 mb-4">
                {session ? (
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Tulis komentarmu..."
                            className="input min-h-[100px] resize-none mb-3"
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || !newComment.trim()}
                                className="btn btn-primary"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Kirim
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-[var(--text-muted)] mb-3">Masuk untuk mengirim komentar</p>
                        <Link href="/login" className="btn btn-primary">
                            Masuk
                        </Link>
                    </div>
                )}
            </div>

            {/* Comment List */}
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                </div>
            ) : comments.length === 0 ? (
                <div className="card p-8 text-center text-[var(--text-muted)]">
                    Belum ada komentar. Jadilah yang pertama!
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="card p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium flex-shrink-0">
                                    {comment.user.image ? (
                                        <img
                                            src={comment.user.image}
                                            alt={comment.user.name || "User"}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        comment.user.name?.[0]?.toUpperCase() || "U"
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{comment.user.name || "Anonymous"}</span>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {formatTime(comment.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] mb-2">{comment.content}</p>
                                    <button className="text-sm text-[var(--text-muted)] hover:text-[var(--color-primary)] flex items-center gap-1">
                                        <Heart className="w-4 h-4" />
                                        {comment.likes}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
