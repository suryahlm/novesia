"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { MessageCircle, Loader2 } from "lucide-react"
import CommentItem from "./CommentItem"
import CommentForm from "./CommentForm"

interface User {
    id: string
    name: string | null
    image: string | null
}

interface Comment {
    id: string
    content: string
    likes: number
    createdAt: string
    user: User
    replies?: Comment[]
}

interface CommentSectionProps {
    chapterId: string
}

export default function CommentSection({ chapterId }: CommentSectionProps) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments?chapterId=${chapterId}`)
            const data = await res.json()
            if (data.comments) {
                setComments(data.comments)
                setTotalCount(data.totalCount)
            }
        } catch (error) {
            console.error("Error fetching comments:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchComments()
    }, [chapterId])

    const handleCommentSubmit = async (content: string, parentId?: string) => {
        if (!session?.user) return

        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chapterId, content, parentId }),
            })

            if (res.ok) {
                fetchComments()
                setReplyingTo(null)
            }
        } catch (error) {
            console.error("Error posting comment:", error)
        }
    }

    const handleLike = async (commentId: string) => {
        try {
            await fetch(`/api/comments/${commentId}/like`, { method: "POST" })
            fetchComments()
        } catch (error) {
            console.error("Error liking comment:", error)
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 border-t border-[var(--bg-tertiary)]">
            <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-5 h-5" />
                <h2 className="font-bold text-lg">Komentar ({totalCount})</h2>
            </div>

            {/* Comment Form */}
            {session?.user ? (
                <CommentForm onSubmit={(content) => handleCommentSubmit(content)} />
            ) : (
                <div className="bg-[var(--bg-secondary)] rounded-lg p-4 text-center text-sm text-[var(--text-muted)] mb-6">
                    <a href="/login" className="text-[var(--color-primary)] hover:underline">
                        Masuk
                    </a>{" "}
                    untuk berkomentar
                </div>
            )}

            {/* Comments List */}
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                    Belum ada komentar. Jadilah yang pertama!
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onLike={handleLike}
                            onReply={(id) => setReplyingTo(id)}
                            replyingTo={replyingTo}
                            onReplySubmit={handleCommentSubmit}
                            onCancelReply={() => setReplyingTo(null)}
                            isLoggedIn={!!session?.user}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
