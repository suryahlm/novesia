"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen, Star, Eye } from "lucide-react"
import { getProxiedImageUrl } from "@/lib/image-utils"
import { formatNumber } from "@/lib/utils"

interface Novel {
    id: string
    title: string
    slug: string
    cover: string | null
    author: string | null
    synopsis: string
    avgRating: number
    totalViews: number
    genres: { id: string; name: string }[]
}

interface HeroCarouselProps {
    novels: Novel[]
}

export default function HeroCarousel({ novels }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % novels.length)
    }, [novels.length])

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + novels.length) % novels.length)
    }, [novels.length])

    // Auto-rotate every 5 seconds
    useEffect(() => {
        if (!isAutoPlaying || novels.length <= 1) return
        const timer = setInterval(nextSlide, 5000)
        return () => clearInterval(timer)
    }, [isAutoPlaying, nextSlide, novels.length])

    if (!novels.length) return null

    const currentNovel = novels[currentIndex]

    return (
        <section className="relative overflow-hidden rounded-2xl mb-6 sm:mb-10">
            {/* Background with gradient overlay */}
            <div className="absolute inset-0">
                {currentNovel.cover ? (
                    <img
                        src={getProxiedImageUrl(currentNovel.cover) || currentNovel.cover}
                        alt=""
                        className="w-full h-full object-cover blur-sm scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-amber-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 sm:p-10 min-h-[320px] sm:min-h-[400px]">
                {/* Cover Image */}
                <Link
                    href={`/novel/${currentNovel.slug}`}
                    className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300"
                >
                    <div className="w-40 sm:w-48 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20">
                        {currentNovel.cover ? (
                            <img
                                src={getProxiedImageUrl(currentNovel.cover) || currentNovel.cover}
                                alt={currentNovel.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-amber-600 flex items-center justify-center">
                                <BookOpen className="w-16 h-16 text-white/50" />
                            </div>
                        )}
                    </div>
                </Link>

                {/* Info */}
                <div className="flex-1 text-white text-center md:text-left">
                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                        {currentNovel.genres.slice(0, 3).map((genre) => (
                            <span
                                key={genre.id}
                                className="px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur rounded-full"
                            >
                                {genre.name}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <Link href={`/novel/${currentNovel.slug}`}>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                            {currentNovel.title}
                        </h2>
                    </Link>

                    {/* Author */}
                    {currentNovel.author && (
                        <p className="text-white/70 mb-3">oleh {currentNovel.author}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 justify-center md:justify-start mb-4 text-sm">
                        <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {currentNovel.avgRating.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(currentNovel.totalViews)}
                        </span>
                    </div>

                    {/* Synopsis */}
                    <p className="text-white/80 text-sm sm:text-base line-clamp-3 mb-6 max-w-2xl">
                        {currentNovel.synopsis}
                    </p>

                    {/* CTA */}
                    <Link
                        href={`/novel/${currentNovel.slug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium rounded-lg transition-colors"
                    >
                        <BookOpen className="w-5 h-5" />
                        Baca Sekarang
                    </Link>
                </div>
            </div>

            {/* Navigation Arrows */}
            {novels.length > 1 && (
                <>
                    <button
                        onClick={() => { prevSlide(); setIsAutoPlaying(false) }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-20"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => { nextSlide(); setIsAutoPlaying(false) }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-20"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {novels.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {novels.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => { setCurrentIndex(index); setIsAutoPlaying(false) }}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                ? "w-6 bg-white"
                                : "bg-white/50 hover:bg-white/70"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
