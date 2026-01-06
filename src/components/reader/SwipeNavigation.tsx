"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"

interface SwipeNavigationProps {
    prevChapterId: string | null
    nextChapterId: string | null
    threshold?: number
    onSwipeStart?: () => void
}

interface SwipeState {
    direction: "left" | "right" | null
    progress: number
    isNavigating: boolean
}

export function useSwipeNavigation({
    prevChapterId,
    nextChapterId,
    threshold = 100,
    onSwipeStart,
}: SwipeNavigationProps) {
    const router = useRouter()
    const [swipeState, setSwipeState] = useState<SwipeState>({
        direction: null,
        progress: 0,
        isNavigating: false,
    })

    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    const touchCurrentX = useRef(0)
    const isSwipeActive = useRef(false)

    const handleTouchStart = useCallback((e: TouchEvent) => {
        // Only track horizontal swipes from near the edges
        const touch = e.touches[0]
        touchStartX.current = touch.clientX
        touchStartY.current = touch.clientY
        touchCurrentX.current = touch.clientX
        isSwipeActive.current = false
    }, [])

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (swipeState.isNavigating) return

        const touch = e.touches[0]
        const diffX = touch.clientX - touchStartX.current
        const diffY = Math.abs(touch.clientY - touchStartY.current)

        // If vertical scroll is dominant, don't treat as swipe
        if (diffY > Math.abs(diffX) * 1.5 && !isSwipeActive.current) {
            return
        }

        // Only start swipe if horizontal movement is significant
        if (Math.abs(diffX) < 20 && !isSwipeActive.current) return

        // Mark swipe as active
        if (!isSwipeActive.current && Math.abs(diffX) >= 20) {
            isSwipeActive.current = true
            onSwipeStart?.()
        }

        if (!isSwipeActive.current) return

        touchCurrentX.current = touch.clientX

        // Determine direction
        const direction = diffX > 0 ? "right" : "left"
        const progress = Math.min(Math.abs(diffX), threshold * 1.5)

        // Only allow swipe if chapter exists
        if (direction === "right" && !prevChapterId) return
        if (direction === "left" && !nextChapterId) return

        setSwipeState({
            direction,
            progress,
            isNavigating: false,
        })

        // Prevent default only when swiping horizontally
        if (Math.abs(diffX) > 30) {
            e.preventDefault()
        }
    }, [prevChapterId, nextChapterId, threshold, swipeState.isNavigating, onSwipeStart])

    const handleTouchEnd = useCallback(() => {
        if (!isSwipeActive.current || swipeState.isNavigating) {
            setSwipeState({ direction: null, progress: 0, isNavigating: false })
            return
        }

        const diffX = touchCurrentX.current - touchStartX.current

        // Check if swipe passed threshold
        if (Math.abs(diffX) >= threshold) {
            const direction = diffX > 0 ? "right" : "left"

            if (direction === "right" && prevChapterId) {
                setSwipeState({ direction: "right", progress: threshold * 1.5, isNavigating: true })
                setTimeout(() => {
                    router.push(`/read/${prevChapterId}`)
                }, 300)
            } else if (direction === "left" && nextChapterId) {
                setSwipeState({ direction: "left", progress: threshold * 1.5, isNavigating: true })
                setTimeout(() => {
                    router.push(`/read/${nextChapterId}`)
                }, 300)
            } else {
                setSwipeState({ direction: null, progress: 0, isNavigating: false })
            }
        } else {
            // Spring back
            setSwipeState({ direction: null, progress: 0, isNavigating: false })
        }

        isSwipeActive.current = false
    }, [swipeState.isNavigating, threshold, prevChapterId, nextChapterId, router])

    // Add touch event listeners
    useEffect(() => {
        const handleTouchMovePassive = (e: TouchEvent) => handleTouchMove(e)

        document.addEventListener("touchstart", handleTouchStart, { passive: true })
        document.addEventListener("touchmove", handleTouchMovePassive, { passive: false })
        document.addEventListener("touchend", handleTouchEnd, { passive: true })

        return () => {
            document.removeEventListener("touchstart", handleTouchStart)
            document.removeEventListener("touchmove", handleTouchMovePassive)
            document.removeEventListener("touchend", handleTouchEnd)
        }
    }, [handleTouchStart, handleTouchMove, handleTouchEnd])

    return swipeState
}

interface SwipeIndicatorProps {
    swipeState: SwipeState
    threshold: number
}

export function SwipeIndicator({ swipeState, threshold }: SwipeIndicatorProps) {
    const { direction, progress, isNavigating } = swipeState

    if (!direction || progress < 10) return null

    const opacity = Math.min(progress / threshold, 1)
    const scale = 0.5 + (Math.min(progress / threshold, 1) * 0.5)
    const isReady = progress >= threshold

    return (
        <>
            {/* Left overlay - swipe right for previous */}
            {direction === "right" && (
                <div
                    className="fixed inset-y-0 left-0 w-20 flex items-center justify-center z-50 pointer-events-none"
                    style={{
                        background: `linear-gradient(to right, rgba(245, 158, 11, ${opacity * 0.3}), transparent)`,
                    }}
                >
                    <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                            ${isReady || isNavigating ? "bg-amber-500 text-white" : "bg-white/90 text-amber-500 border-2 border-amber-500"}`}
                        style={{
                            transform: `scale(${scale})`,
                            opacity: opacity,
                        }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Right overlay - swipe left for next */}
            {direction === "left" && (
                <div
                    className="fixed inset-y-0 right-0 w-20 flex items-center justify-center z-50 pointer-events-none"
                    style={{
                        background: `linear-gradient(to left, rgba(245, 158, 11, ${opacity * 0.3}), transparent)`,
                    }}
                >
                    <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                            ${isReady || isNavigating ? "bg-amber-500 text-white" : "bg-white/90 text-amber-500 border-2 border-amber-500"}`}
                        style={{
                            transform: `scale(${scale})`,
                            opacity: opacity,
                        }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Navigation indicator */}
            {isNavigating && (
                <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center pointer-events-none">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl animate-pulse">
                        <p className="text-sm font-medium text-center">
                            {direction === "right" ? "◀ Chapter Sebelumnya" : "Chapter Berikutnya ▶"}
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}
