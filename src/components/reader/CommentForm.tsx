"use client"

import { useState } from "react"
import { Send, X } from "lucide-react"

interface CommentFormProps {
    onSubmit: (content: string) => void
    onCancel?: () => void
    placeholder?: string
    isReply?: boolean
}

export default function CommentForm({
    onSubmit,
    onCancel,
    placeholder = "Tulis komentar...",
    isReply = false,
}: CommentFormProps) {
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || isSubmitting) return

        setIsSubmitting(true)
        await onSubmit(content.trim())
        setContent("")
        setIsSubmitting(false)
    }

    const maxLength = 1000
    const remaining = maxLength - content.length

    return (
        <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    rows={isReply ? 2 : 3}
                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none text-sm"
                />

                <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${remaining < 100 ? "text-amber-500" : "text-[var(--text-muted)]"}`}>
                        {remaining} karakter tersisa
                    </span>

                    <div className="flex gap-2">
                        {isReply && onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!content.trim() || isSubmitting}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            <span>{isSubmitting ? "..." : isReply ? "Balas" : "Kirim"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
