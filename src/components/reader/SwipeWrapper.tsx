"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface SwipeWrapperProps {
    children: React.ReactNode
    novelSlug: string
    prevChapter: number | null
    nextChapter: number | null
}

export default function SwipeWrapper({
    children,
    novelSlug,
    prevChapter,
    nextChapter
}: SwipeWrapperProps) {
    const router = useRouter()
    const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
    const [swipeProgress, setSwipeProgress] = useState(0)
    const [isNavigating, setIsNavigating] = useState(false)

    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    const isSwipeActive = useRef(false)

    const threshold = 80

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0]
            touchStartX.current = touch.clientX
            touchStartY.current = touch.clientY
            isSwipeActive.current = false
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (isNavigating) return

            const touch = e.touches[0]
            const diffX = touch.clientX - touchStartX.current
            const diffY = Math.abs(touch.clientY - touchStartY.current)

            // If vertical scroll is dominant, don't swipe
            if (diffY > Math.abs(diffX) * 1.5 && !isSwipeActive.current) return

            // Need significant horizontal movement
            if (Math.abs(diffX) < 30 && !isSwipeActive.current) return

            isSwipeActive.current = true

            const direction = diffX > 0 ? "right" : "left"
            const progress = Math.min(Math.abs(diffX), threshold * 1.5)

            // Only show indicator if chapter exists
            if (direction === "right" && !prevChapter) return
            if (direction === "left" && !nextChapter) return

            setSwipeDirection(direction)
            setSwipeProgress(progress)
        }

        const handleTouchEnd = () => {
            if (!isSwipeActive.current || isNavigating) {
                setSwipeDirection(null)
                setSwipeProgress(0)
                return
            }

            if (swipeProgress >= threshold) {
                setIsNavigating(true)

                if (swipeDirection === "right" && prevChapter) {
                    setTimeout(() => {
                        router.push(`/novel/${novelSlug}/${prevChapter}`)
                    }, 300)
                } else if (swipeDirection === "left" && nextChapter) {
                    setTimeout(() => {
                        router.push(`/novel/${novelSlug}/${nextChapter}`)
                    }, 300)
                }
            }

            setSwipeDirection(null)
            setSwipeProgress(0)
            isSwipeActive.current = false
        }

        document.addEventListener("touchstart", handleTouchStart, { passive: true })
        document.addEventListener("touchmove", handleTouchMove, { passive: true })
        document.addEventListener("touchend", handleTouchEnd, { passive: true })

        return () => {
            document.removeEventListener("touchstart", handleTouchStart)
            document.removeEventListener("touchmove", handleTouchMove)
            document.removeEventListener("touchend", handleTouchEnd)
        }
    }, [novelSlug, prevChapter, nextChapter, router, swipeProgress, swipeDirection, isNavigating])

    const opacity = Math.min(swipeProgress / threshold, 1)
    const scale = 0.5 + (Math.min(swipeProgress / threshold, 1) * 0.5)
    const isReady = swipeProgress >= threshold

    return (
        <>
            {children}

            {/* Swipe indicators */}
            {swipeDirection === "right" && swipeProgress > 10 && (
                <div
                    className="fixed inset-y-0 left-0 w-20 flex items-center justify-center z-[100] pointer-events-none"
                    style={{
                        background: `linear-gradient(to right, rgba(245, 158, 11, ${opacity * 0.3}), transparent)`,
                    }}
                >
                    <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
                            ${isReady || isNavigating ? "bg-amber-500 text-white" : "bg-white text-amber-500 border-2 border-amber-500"}`}
                        style={{ transform: `scale(${scale})`, opacity }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                </div>
            )}

            {swipeDirection === "left" && swipeProgress > 10 && (
                <div
                    className="fixed inset-y-0 right-0 w-20 flex items-center justify-center z-[100] pointer-events-none"
                    style={{
                        background: `linear-gradient(to left, rgba(245, 158, 11, ${opacity * 0.3}), transparent)`,
                    }}
                >
                    <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
                            ${isReady || isNavigating ? "bg-amber-500 text-white" : "bg-white text-amber-500 border-2 border-amber-500"}`}
                        style={{ transform: `scale(${scale})`, opacity }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Navigation overlay */}
            {isNavigating && (
                <div className="fixed inset-0 bg-black/30 z-[110] flex items-center justify-center pointer-events-none">
                    <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl animate-pulse">
                        <p className="text-sm font-medium text-gray-800">
                            {swipeDirection === "right" ? "◀ Chapter Sebelumnya" : "Chapter Berikutnya ▶"}
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}
