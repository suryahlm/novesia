"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Star, Loader2, User, Send } from "lucide-react"
import Link from "next/link"

interface Rating {
    id: string
    score: number
    review: string | null
    createdAt: string
    user: {
        id: string
        name: string | null
        image: string | null
    }
}

interface RatingStats {
    avgRating: number
    totalRatings: number
    distribution: Record<number, number>
}

interface RatingSectionProps {
    novelId: string
}

export default function RatingSection({ novelId }: RatingSectionProps) {
    const { data: session } = useSession()
    const [ratings, setRatings] = useState<Rating[]>([])
    const [stats, setStats] = useState<RatingStats | null>(null)
    const [userRating, setUserRating] = useState<{ id: string; score: number; review: string | null } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [score, setScore] = useState(0)
    const [hoverScore, setHoverScore] = useState(0)
    const [review, setReview] = useState("")
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    useEffect(() => {
        fetchRatings()
    }, [novelId])

    const fetchRatings = async () => {
        try {
            const res = await fetch(`/api/ratings?novelId=${novelId}`)
            const data = await res.json()
            setRatings(data.ratings || [])
            setStats(data.stats)
            if (data.userRating) {
                setUserRating(data.userRating)
                setScore(data.userRating.score)
                setReview(data.userRating.review || "")
            }
        } catch (error) {
            console.error("Error fetching ratings:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session) return
        if (score === 0) {
            setMessage({ type: "error", text: "Pilih rating bintang terlebih dahulu" })
            return
        }

        setIsSubmitting(true)
        setMessage(null)

        try {
            const res = await fetch("/api/ratings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ novelId, score, review }),
            })

            const data = await res.json()

            if (data.success) {
                setMessage({ type: "success", text: data.message })
                setUserRating(data.rating)
                fetchRatings() // Refresh ratings
            } else {
                setMessage({ type: "error", text: data.error })
            }
        } catch (error) {
            setMessage({ type: "error", text: "Terjadi kesalahan" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
        const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${sizeClass} ${star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-400"
                            }`}
                    />
                ))}
            </div>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Section */}
            <div className="card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Rating & Ulasan
                </h3>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Average Rating */}
                    <div className="text-center">
                        <div className="text-5xl font-bold text-amber-400">
                            {stats?.avgRating?.toFixed(1) || "0.0"}
                        </div>
                        <div className="mt-1">{renderStars(Math.round(stats?.avgRating || 0), "lg")}</div>
                        <div className="text-sm text-[var(--text-muted)] mt-1">
                            {stats?.totalRatings || 0} ulasan
                        </div>
                    </div>

                    {/* Distribution */}
                    <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = stats?.distribution[star] || 0
                            const total = stats?.totalRatings || 1
                            const percentage = (count / total) * 100

                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-sm w-4">{star}</span>
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-[var(--text-muted)] w-8">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Write Review Form */}
            <div className="card p-6">
                <h4 className="font-bold mb-4">
                    {userRating ? "Edit Ulasan Kamu" : "Tulis Ulasan"}
                </h4>

                {!session ? (
                    <div className="text-center py-4">
                        <p className="text-[var(--text-muted)] mb-4">
                            Masuk untuk memberikan rating dan ulasan
                        </p>
                        <Link href="/login" className="btn btn-primary">
                            Masuk
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Star Rating Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="p-1 transition-transform hover:scale-110"
                                        onMouseEnter={() => setHoverScore(star)}
                                        onMouseLeave={() => setHoverScore(0)}
                                        onClick={() => setScore(star)}
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors ${star <= (hoverScore || score)
                                                ? "fill-amber-400 text-amber-400"
                                                : "text-gray-400"
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Review Text */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Ulasan (opsional)
                            </label>
                            <textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Bagikan pendapat kamu tentang novel ini..."
                                rows={4}
                                maxLength={1000}
                                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                            />
                            <div className="text-xs text-[var(--text-muted)] text-right mt-1">
                                {review.length}/1000
                            </div>
                        </div>

                        {/* Message */}
                        {message && (
                            <div
                                className={`p-3 rounded-lg ${message.type === "success"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || score === 0}
                            className="btn btn-primary disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    {userRating ? "Update Ulasan" : "Kirim Ulasan"}
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* Reviews List */}
            {ratings.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-bold">Ulasan Terbaru</h4>
                    {ratings.map((rating) => (
                        <div key={rating.id} className="card p-4">
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
                                    {rating.user.image ? (
                                        <img
                                            src={rating.user.image}
                                            alt={rating.user.name || "User"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-[var(--text-muted)]" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium truncate">
                                            {rating.user.name || "Anonim"}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {formatDate(rating.createdAt)}
                                        </span>
                                    </div>
                                    <div className="mt-1">{renderStars(rating.score, "sm")}</div>
                                    {rating.review && (
                                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                            {rating.review}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {ratings.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                    Belum ada ulasan. Jadilah yang pertama! ⭐
                </div>
            )}
        </div>
    )
}
