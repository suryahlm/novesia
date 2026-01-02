"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Gift, Coins, Crown, CheckCircle, LogIn, Star, Zap, Users, Copy, Check, Loader2 } from "lucide-react"

interface UserStats {
    coins: number
    readingStreak: number
    referralCount: number
}

export default function RewardsPage() {
    const { data: session, status } = useSession()
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (session) {
            fetch("/api/user/stats")
                .then(res => res.json())
                .then(data => setUserStats(data))
                .catch(() => setUserStats({ coins: 50, readingStreak: 0, referralCount: 0 }))
        }
    }, [session])

    const handleCopyReferral = () => {
        const referralLink = `${window.location.origin}/register?ref=${session?.user?.id}`
        navigator.clipboard.writeText(referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="text-center">
                    <Gift className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Hadiah & Reward</h1>
                    <p className="text-[var(--text-muted)] mb-6">
                        Masuk untuk mendapatkan hadiah harian
                    </p>
                    <Link href="/login" className="btn btn-primary">
                        <LogIn className="w-4 h-4 mr-2" />
                        Masuk
                    </Link>
                </div>
            </div>
        )
    }

    const dailyTasks = [
        { icon: CheckCircle, label: "Login harian", reward: 5, completed: true },
        { icon: Star, label: "Baca 1 chapter", reward: 10, completed: false },
        { icon: Zap, label: "Baca 5 chapter", reward: 30, completed: false },
    ]

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">Hadiah & Reward</h1>
                    <p className="text-[var(--text-muted)]">
                        Selesaikan tugas harian untuk mendapatkan koin gratis
                    </p>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="card p-6 text-center">
                        <Coins className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        {userStats ? (
                            <p className="text-2xl font-bold">{userStats.coins}</p>
                        ) : (
                            <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                        )}
                        <p className="text-sm text-[var(--text-muted)]">Koin</p>
                    </div>
                    <div className="card p-6 text-center">
                        <Crown className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        {userStats ? (
                            <p className="text-2xl font-bold">{userStats.readingStreak}</p>
                        ) : (
                            <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                        )}
                        <p className="text-sm text-[var(--text-muted)]">Hari Streak</p>
                    </div>
                    <div className="card p-6 text-center">
                        <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        {userStats ? (
                            <p className="text-2xl font-bold">{userStats.referralCount}</p>
                        ) : (
                            <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                        )}
                        <p className="text-sm text-[var(--text-muted)]">Referral</p>
                    </div>
                </div>

                {/* Referral Section */}
                <div className="card p-6 mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                    <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Ajak Teman, Dapat Koin!
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                        Bagikan link referral kamu dan dapatkan <span className="text-amber-500 font-bold">50 koin</span> untuk setiap teman yang mendaftar!
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${session?.user?.id?.slice(0, 8)}...`}
                            className="input flex-1 text-sm bg-[var(--bg-tertiary)]"
                        />
                        <button
                            onClick={handleCopyReferral}
                            className={`btn ${copied ? "bg-green-500 hover:bg-green-600" : "btn-primary"}`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Tersalin!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-1" />
                                    Salin
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Daily Check-in */}
                <div className="card p-6 mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[var(--color-primary)]" />
                        Check-in Harian
                    </h2>
                    <div className="grid grid-cols-7 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <div
                                key={day}
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm ${day === 1
                                    ? "bg-[var(--color-primary)] text-white"
                                    : "bg-[var(--bg-tertiary)]"
                                    }`}
                            >
                                <span className="text-xs">Hari</span>
                                <span className="font-bold">{day}</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-primary w-full mt-4">
                        <Gift className="w-4 h-4 mr-2" />
                        Klaim Hadiah Hari Ini
                    </button>
                </div>

                {/* Daily Tasks */}
                <div className="card p-6">
                    <h2 className="font-bold text-lg mb-4">Tugas Harian</h2>
                    <div className="space-y-3">
                        {dailyTasks.map((task, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-4 rounded-lg ${task.completed
                                    ? "bg-green-500/10 border border-green-500/20"
                                    : "bg-[var(--bg-tertiary)]"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <task.icon
                                        className={`w-5 h-5 ${task.completed ? "text-green-500" : "text-[var(--text-muted)]"
                                            }`}
                                    />
                                    <span className={task.completed ? "line-through text-[var(--text-muted)]" : ""}>
                                        {task.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Coins className="w-4 h-4" />
                                    <span className="font-medium">+{task.reward}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
