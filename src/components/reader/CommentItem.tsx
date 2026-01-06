"use client"

import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Heart, MessageCircle, User } from "lucide-react"
import CommentForm from "./CommentForm"

interface CommentUser {
    id: string
    name: string | null
    image: string | null
}

interface Comment {
    id: string
    content: string
    likes: number
    createdAt: string
    user: CommentUser
    replies?: Comment[]
}

interface CommentItemProps {
    comment: Comment
    onLike: (id: string) => void
    onReply: (id: string) => void
    replyingTo: string | null
    onReplySubmit: (content: string, parentId: string) => void
    onCancelReply: () => void
    isLoggedIn: boolean
    isReply?: boolean
}

export default function CommentItem({
    comment,
    onLike,
    onReply,
    replyingTo,
    onReplySubmit,
    onCancelReply,
    isLoggedIn,
    isReply = false,
}: CommentItemProps) {
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
        addSuffix: true,
        locale: idLocale,
    })

    return (
        <div className={`${isReply ? "ml-8 mt-3" : ""}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                {comment.user.image ? (
                    <img
                        src={comment.user.image}
                        alt={comment.user.name || "User"}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                            {comment.user.name || "Anonim"}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{timeAgo}</span>
                    </div>

                    <p className="text-sm leading-relaxed mb-2 whitespace-pre-wrap">
                        {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onLike(comment.id)}
                            disabled={!isLoggedIn}
                            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                            <Heart className="w-4 h-4" />
                            <span>{comment.likes > 0 ? comment.likes : ""}</span>
                        </button>

                        {!isReply && isLoggedIn && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Balas</span>
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                        <div className="mt-3">
                            <CommentForm
                                onSubmit={(content) => onReplySubmit(content, comment.id)}
                                onCancel={onCancelReply}
                                placeholder={`Balas ${comment.user.name || "Anonim"}...`}
                                isReply
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="border-l-2 border-[var(--bg-tertiary)] pl-2">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onLike={onLike}
                            onReply={onReply}
                            replyingTo={replyingTo}
                            onReplySubmit={onReplySubmit}
                            onCancelReply={onCancelReply}
                            isLoggedIn={isLoggedIn}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
