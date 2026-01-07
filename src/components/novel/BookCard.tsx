"use client"

import Link from "next/link"
import { Star, Eye, BookOpen, Crown, Sparkles } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"
import { getProxiedImageUrl } from "@/lib/image-utils"

interface BookCardProps {
    id: string
    title: string
    slug: string
    cover?: string | null
    author?: string | null
    rating?: number
    views?: number
    chaptersCount?: number
    status?: "ONGOING" | "COMPLETED" | "HIATUS" | "DROPPED"
    isPremium?: boolean
    isNew?: boolean
    isHot?: boolean
    locale?: "id" | "en"
    size?: "sm" | "md" | "lg"
}

const statusLabels = {
    ONGOING: { id: "Ongoing", en: "Ongoing" },
    COMPLETED: { id: "Tamat", en: "Completed" },
    HIATUS: { id: "Hiatus", en: "Hiatus" },
    DROPPED: { id: "Dropped", en: "Dropped" },
}

export default function BookCard({
    id,
    title,
    slug,
    cover,
    author,
    rating = 0,
    views = 0,
    chaptersCount = 0,
    status = "ONGOING",
    isPremium = false,
    isNew = false,
    isHot = false,
    locale = "id",
    size = "md",
}: BookCardProps) {
    const t = (key: { id: string; en: string }) => key[locale]
    const coverUrl = getProxiedImageUrl(cover)

    const sizeClasses = {
        sm: "w-full",
        md: "w-full",
        lg: "w-[140px] sm:w-44",
    }

    return (
        <Link
            href={`/novel/${slug}`}
            className={cn("group block flex-shrink-0", sizeClasses[size])}
        >
            <div className="card overflow-hidden">
                {/* Cover Image */}
                <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-[var(--text-muted)]" />
                        </div>
                    )}

                    {/* Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {isPremium && (
                            <span className="badge badge-premium text-xs">
                                <Crown className="w-3 h-3 mr-0.5" />
                                VIP
                            </span>
                        )}
                        {isNew && (
                            <span className="badge bg-green-500 text-white text-xs">
                                <Sparkles className="w-3 h-3 mr-0.5" />
                                {t({ id: "Baru", en: "New" })}
                            </span>
                        )}
                        {isHot && (
                            <span className="badge bg-red-500 text-white text-xs">
                                🔥 Hot
                            </span>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute bottom-2 right-2">
                        <span
                            className={cn(
                                "badge text-xs",
                                status === "COMPLETED"
                                    ? "bg-green-500/90 text-white"
                                    : status === "ONGOING"
                                        ? "bg-blue-500/90 text-white"
                                        : "bg-gray-500/90 text-white"
                            )}
                        >
                            {t(statusLabels[status])}
                        </span>
                    </div>

                    {/* Quick Stats Overlay (shown on hover - desktop only) */}
                    <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center justify-between text-white text-xs">
                            <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {formatNumber(views)}
                            </span>
                            <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {chaptersCount} Ch
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="p-2">
                    <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                        {title}
                    </h3>

                    {author && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                            {author}
                        </p>
                    )}

                    {/* Stats row - visible on mobile */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            {formatNumber(views)}
                        </span>
                        <span className="flex items-center gap-0.5">
                            <BookOpen className="w-3 h-3" />
                            {chaptersCount}
                        </span>
                        {rating > 0 && (
                            <span className="flex items-center gap-0.5 ml-auto">
                                <Star className="w-3 h-3 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                                {rating.toFixed(1)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}

// Skeleton Loading Component
export function BookCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "w-[100px]",
        md: "w-[120px] sm:w-36",
        lg: "w-[140px] sm:w-44",
    }

    return (
        <div className={sizeClasses[size]}>
            <div className="card overflow-hidden">
                <div className="aspect-book skeleton" />
                <div className="p-2 space-y-2">
                    <div className="h-4 skeleton rounded" />
                    <div className="h-3 skeleton rounded w-3/4" />
                    <div className="h-3 skeleton rounded w-1/2" />
                </div>
            </div>
        </div>
    )
}
