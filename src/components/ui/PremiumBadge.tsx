"use client"

import { Crown, Coins } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

interface PremiumBadgeProps {
    coinCost: number
    showText?: boolean
}

export default function PremiumBadge({ coinCost, showText = false }: PremiumBadgeProps) {
    const { data: session } = useSession()
    const [isVip, setIsVip] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session?.user?.id) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    setIsVip(data.isVip || false)
                })
                .catch(() => setIsVip(false))
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [session?.user?.id])

    // If user is VIP, don't show the badge
    if (!loading && isVip) {
        return null
    }

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
            <Crown className="w-3 h-3" />
            {showText ? (
                <span>VIP/Buka dengan {coinCost} coin</span>
            ) : (
                <span>{coinCost}</span>
            )}
        </span>
    )
}

// For chapter number buttons with crown overlay
export function ChapterNumberWithCrown({
    chapterNumber,
    isPremium,
    href,
    title
}: {
    chapterNumber: number
    isPremium: boolean
    href: string
    title?: string
}) {
    const { data: session } = useSession()
    const [isVip, setIsVip] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session?.user?.id) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    setIsVip(data.isVip || false)
                })
                .catch(() => setIsVip(false))
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [session?.user?.id])

    const showCrown = isPremium && !loading && !isVip

    return (
        <a
            href={href}
            className="relative w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--bg-tertiary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors text-sm font-medium"
            title={title}
        >
            {chapterNumber}
            {showCrown && (
                <Crown className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-500" />
            )}
        </a>
    )
}
