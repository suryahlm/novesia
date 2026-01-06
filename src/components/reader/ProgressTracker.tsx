"use client"

import { useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"

interface ProgressTrackerProps {
    chapterId: string
}

export default function ProgressTracker({ chapterId }: ProgressTrackerProps) {
    const { data: session } = useSession()
    const lastSavedProgress = useRef(0)
    const hasMarkedComplete = useRef(false)

    const saveProgress = useCallback(async (progress: number) => {
        if (!session?.user) return

        try {
            await fetch("/api/user/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chapterId, progress }),
            })
        } catch (error) {
            console.error("Error saving progress:", error)
        }
    }, [chapterId, session])

    useEffect(() => {
        if (!session?.user) return

        const handleScroll = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0

            // Save progress every 10% increment
            if (Math.abs(progress - lastSavedProgress.current) >= 10) {
                lastSavedProgress.current = progress
                saveProgress(progress)
            }

            // Mark as complete if scrolled to 70%+ (handled by API)
            if (progress >= 70 && !hasMarkedComplete.current) {
                hasMarkedComplete.current = true
                saveProgress(progress)
            }
        }

        // Save initial progress after short delay
        const initialTimeout = setTimeout(() => {
            saveProgress(0)
        }, 1000)

        // Throttle scroll handler
        let rafId: number | null = null
        const throttledScroll = () => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                handleScroll()
                rafId = null
            })
        }

        window.addEventListener("scroll", throttledScroll, { passive: true })

        // Save progress when leaving page
        const handleBeforeUnload = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0

            // Use sendBeacon for reliable delivery on page unload
            navigator.sendBeacon(
                "/api/user/progress",
                JSON.stringify({ chapterId, progress })
            )
        }

        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
            clearTimeout(initialTimeout)
            window.removeEventListener("scroll", throttledScroll)
            window.removeEventListener("beforeunload", handleBeforeUnload)
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [chapterId, session, saveProgress])

    // This component doesn't render anything visible
    return null
}
