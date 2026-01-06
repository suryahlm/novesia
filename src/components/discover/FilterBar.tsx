"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    TrendingUp,
    Clock,
    Star,
    ArrowDownAZ,
    X,
    SlidersHorizontal,
    Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Genre {
    id: string
    name: string
    slug: string
    _count: { novels: number }
}

const sortOptions = [
    { value: "trending", label: "Trending", icon: TrendingUp },
    { value: "newest", label: "Terbaru", icon: Clock },
    { value: "rating", label: "Rating Tertinggi", icon: Star },
    { value: "az", label: "A-Z", icon: ArrowDownAZ },
]

const statusOptions = [
    { value: "", label: "Semua" },
    { value: "ONGOING", label: "Ongoing" },
    { value: "COMPLETED", label: "Tamat" },
]

interface FilterBarProps {
    onFilterChange?: (filters: {
        genres: string[]
        status: string
        sort: string
    }) => void
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [genres, setGenres] = useState<Genre[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showMobileFilters, setShowMobileFilters] = useState(false)

    // Parse URL params
    const selectedGenres = searchParams.get("genres")?.split(",").filter(Boolean) || []
    const selectedStatus = searchParams.get("status") || ""
    const selectedSort = searchParams.get("sort") || "trending"
    const searchQuery = searchParams.get("q") || ""

    // Fetch genres
    useEffect(() => {
        fetch("/api/genres")
            .then((res) => res.json())
            .then((data) => {
                setGenres(data)
                setIsLoading(false)
            })
            .catch(() => setIsLoading(false))
    }, [])

    // Update URL with filters
    const updateFilters = (updates: {
        genres?: string[]
        status?: string
        sort?: string
    }) => {
        const params = new URLSearchParams(searchParams.toString())

        if (updates.genres !== undefined) {
            if (updates.genres.length > 0) {
                params.set("genres", updates.genres.join(","))
            } else {
                params.delete("genres")
            }
        }

        if (updates.status !== undefined) {
            if (updates.status) {
                params.set("status", updates.status)
            } else {
                params.delete("status")
            }
        }

        if (updates.sort !== undefined) {
            if (updates.sort && updates.sort !== "trending") {
                params.set("sort", updates.sort)
            } else {
                params.delete("sort")
            }
        }

        router.push(`/discover?${params.toString()}`)

        // Notify parent
        onFilterChange?.({
            genres: updates.genres ?? selectedGenres,
            status: updates.status ?? selectedStatus,
            sort: updates.sort ?? selectedSort,
        })
    }

    const toggleGenre = (slug: string) => {
        const newGenres = selectedGenres.includes(slug)
            ? selectedGenres.filter((g) => g !== slug)
            : [...selectedGenres, slug]
        updateFilters({ genres: newGenres })
    }

    const clearFilters = () => {
        const params = new URLSearchParams()
        if (searchQuery) params.set("q", searchQuery)
        router.push(`/discover?${params.toString()}`)
    }

    const hasActiveFilters =
        selectedGenres.length > 0 || selectedStatus || selectedSort !== "trending"

    return (
        <div className="space-y-3 mb-6">
            {/* Top Bar - Sort & Mobile Filter Toggle */}
            <div className="flex items-center justify-between gap-3">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => updateFilters({ sort: option.value })}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                selectedSort === option.value
                                    ? "bg-[var(--color-primary)] text-white"
                                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <option.icon className="w-4 h-4" />
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Mobile Filter Button */}
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={cn(
                        "sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        hasActiveFilters
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    )}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filter
                    {hasActiveFilters && (
                        <span className="ml-1 w-5 h-5 flex items-center justify-center bg-white/20 rounded-full text-xs">
                            {selectedGenres.length + (selectedStatus ? 1 : 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* Status Filter - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-[var(--text-muted)]">Status:</span>
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => updateFilters({ status: option.value })}
                        className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                            selectedStatus === option.value
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Genre Chips - Desktop */}
            <div className="hidden sm:block">
                {isLoading ? (
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-7 w-20 skeleton rounded-full" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-[var(--text-muted)] py-1">Genre:</span>
                        {genres.map((genre) => (
                            <button
                                key={genre.id}
                                onClick={() => toggleGenre(genre.slug)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1",
                                    selectedGenres.includes(genre.slug)
                                        ? "bg-[var(--color-primary)] text-white"
                                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                                )}
                            >
                                {selectedGenres.includes(genre.slug) && (
                                    <Check className="w-3 h-3" />
                                )}
                                {genre.name}
                                <span className="opacity-60">({genre._count.novels})</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                    <X className="w-4 h-4" />
                    Hapus Filter
                </button>
            )}

            {/* Mobile Filters Panel */}
            {showMobileFilters && (
                <div className="sm:hidden card p-4 space-y-4 animate-slide-up">
                    {/* Status */}
                    <div>
                        <p className="text-sm font-medium mb-2">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => updateFilters({ status: option.value })}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                                        selectedStatus === option.value
                                            ? "bg-[var(--color-primary)] text-white"
                                            : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Genres */}
                    <div>
                        <p className="text-sm font-medium mb-2">Genre</p>
                        <div className="flex flex-wrap gap-2">
                            {genres.map((genre) => (
                                <button
                                    key={genre.id}
                                    onClick={() => toggleGenre(genre.slug)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1",
                                        selectedGenres.includes(genre.slug)
                                            ? "bg-[var(--color-primary)] text-white"
                                            : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                    )}
                                >
                                    {selectedGenres.includes(genre.slug) && (
                                        <Check className="w-3 h-3" />
                                    )}
                                    {genre.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Apply Button */}
                    <button
                        onClick={() => setShowMobileFilters(false)}
                        className="btn btn-primary w-full"
                    >
                        Terapkan Filter
                    </button>
                </div>
            )}
        </div>
    )
}
