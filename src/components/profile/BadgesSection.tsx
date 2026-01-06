"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Award, Lock, Loader2 } from "lucide-react"
import { RARITY_COLORS } from "@/lib/badges"

interface Badge {
    id: string
    name: string
    description: string
    icon: string
    category: string
    rarity: "common" | "rare" | "epic" | "legendary"
    unlocked: boolean
    unlockedAt: string | null
}

interface BadgesResponse {
    all: Badge[]
    totalUnlocked: number
    totalBadges: number
}

export default function BadgesSection() {
    const { data: session } = useSession()
    const [badges, setBadges] = useState<Badge[]>([])
    const [stats, setStats] = useState({ unlocked: 0, total: 0 })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!session?.user) return

        const fetchBadges = async () => {
            try {
                // First, check for new badges
                await fetch("/api/user/badges", { method: "POST" })

                // Then fetch all badges
                const res = await fetch("/api/user/badges")
                const data: BadgesResponse = await res.json()

                if (data.all) {
                    setBadges(data.all)
                    setStats({ unlocked: data.totalUnlocked, total: data.totalBadges })
                }
            } catch (error) {
                console.error("Error fetching badges:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchBadges()
    }, [session])

    if (!session?.user) return null

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
            </div>
        )
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[var(--color-primary)]" />
                    <h2 className="font-bold text-lg">Pencapaian</h2>
                </div>
                <span className="text-sm text-[var(--text-muted)]">
                    {stats.unlocked} / {stats.total} terbuka
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-[var(--bg-tertiary)] rounded-full mb-6 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-[var(--color-primary)] to-amber-400 transition-all"
                    style={{ width: `${(stats.unlocked / stats.total) * 100}%` }}
                />
            </div>

            {/* Badges grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {badges.map((badge) => (
                    <div
                        key={badge.id}
                        className={`relative p-3 rounded-xl text-center transition-all ${badge.unlocked
                                ? "bg-[var(--bg-secondary)] hover:scale-105 cursor-default"
                                : "bg-[var(--bg-tertiary)] opacity-50"
                            }`}
                        title={badge.unlocked
                            ? `${badge.name}: ${badge.description}`
                            : `🔒 ${badge.name}: ${badge.description}`
                        }
                    >
                        {/* Rarity indicator */}
                        {badge.unlocked && (
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${badge.rarity === "legendary" ? "bg-amber-500" :
                                    badge.rarity === "epic" ? "bg-purple-500" :
                                        badge.rarity === "rare" ? "bg-blue-500" : "bg-gray-400"
                                }`} />
                        )}

                        {/* Icon */}
                        <div className="text-2xl mb-1">
                            {badge.unlocked ? badge.icon : <Lock className="w-6 h-6 mx-auto text-[var(--text-muted)]" />}
                        </div>

                        {/* Name */}
                        <p className="text-xs font-medium line-clamp-1">
                            {badge.unlocked ? badge.name : "???"}
                        </p>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400" /> Umum
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Langka
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Epik
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Legendaris
                </span>
            </div>
        </div>
    )
}
