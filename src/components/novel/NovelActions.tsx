"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Heart, Share2, Check } from "lucide-react"

interface NovelActionsProps {
    novelId: string
    novelTitle: string
}

export default function NovelActions({ novelId, novelTitle }: NovelActionsProps) {
    const { data: session } = useSession()
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showCopied, setShowCopied] = useState(false)

    const handleBookmark = async () => {
        if (!session) {
            // Redirect to login
            window.location.href = "/login?callbackUrl=" + encodeURIComponent(window.location.pathname)
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch("/api/bookmarks", {
                method: isBookmarked ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ novelId }),
            })

            if (response.ok) {
                setIsBookmarked(!isBookmarked)
            }
        } catch (error) {
            console.error("Error toggling bookmark:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleShare = async () => {
        const url = window.location.href

        // Try native share first
        if (navigator.share) {
            try {
                await navigator.share({
                    title: novelTitle,
                    text: `Baca ${novelTitle} di Novesia!`,
                    url,
                })
                return
            } catch (error) {
                // User cancelled or error, fall back to clipboard
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(url)
            setShowCopied(true)
            setTimeout(() => setShowCopied(false), 2000)
        } catch (error) {
            console.error("Failed to copy:", error)
        }
    }

    return (
        <>
            <button
                onClick={handleBookmark}
                disabled={isLoading}
                className={`btn ${isBookmarked ? "btn-primary" : "btn-ghost"}`}
            >
                <Heart className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                {isBookmarked ? "Tersimpan" : "Simpan"}
            </button>
            <button
                onClick={handleShare}
                className="btn btn-ghost relative"
            >
                {showCopied ? (
                    <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="ml-2 text-green-500 text-sm">Tersalin!</span>
                    </>
                ) : (
                    <Share2 className="w-4 h-4" />
                )}
            </button>
        </>
    )
}
