"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Gift, Coins, Crown, CheckCircle, LogIn, Star, Zap, Users, Copy, Check, Loader2 } from "lucide-react"

interface UserStats {
    coins: number
    readingStreak: number
    referralCount: number
    lastCheckIn: string | null
}

interface DailyTask {
    id: string
    label: string
    reward: number
    completed: boolean
    claimed: boolean
    canClaim: boolean
}

export default function RewardsPage() {
    const { data: session, status } = useSession()
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
    const [copied, setCopied] = useState(false)
    const [claiming, setClaiming] = useState(false)
    const [claimingTask, setClaimingTask] = useState<string | null>(null)
    const [claimMessage, setClaimMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    useEffect(() => {
        if (session) {
            fetchStats()
            fetchTasks()
        }
    }, [session])

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/user/stats")
            const data = await res.json()
            setUserStats(data)
        } catch {
            setUserStats({ coins: 0, readingStreak: 0, referralCount: 0, lastCheckIn: null })
        }
    }

    const fetchTasks = async () => {
        try {
            const res = await fetch("/api/rewards/tasks")
            const data = await res.json()
            if (data.tasks) {
                setDailyTasks(data.tasks)
            }
        } catch (error) {
            console.error("Error fetching tasks:", error)
        }
    }

    const claimTask = async (taskId: string) => {
        setClaimingTask(taskId)
        try {
            const res = await fetch("/api/rewards/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId }),
            })
            const data = await res.json()

            if (res.ok) {
                setClaimMessage({ type: "success", text: `+${data.reward} koin!` })
                fetchStats()
                fetchTasks()
                setTimeout(() => setClaimMessage(null), 3000)
            } else {
                setClaimMessage({ type: "error", text: data.error || "Gagal klaim" })
            }
        } catch {
            setClaimMessage({ type: "error", text: "Terjadi kesalahan" })
        } finally {
            setClaimingTask(null)
        }
    }

    const claimDaily = async () => {
        setClaiming(true)
        setClaimMessage(null)
        try {
            const res = await fetch("/api/rewards/claim", { method: "POST" })
            const data = await res.json()

            if (res.ok) {
                setClaimMessage({ type: "success", text: `+${data.reward} koin! Streak: ${data.streak} hari` })
                fetchStats() // Refresh stats
            } else {
                if (data.alreadyClaimed) {
                    setClaimMessage({ type: "error", text: "Sudah klaim hari ini! Kembali besok." })
                } else {
                    setClaimMessage({ type: "error", text: data.error || "Gagal klaim" })
                }
            }
        } catch {
            setClaimMessage({ type: "error", text: "Terjadi kesalahan" })
        } finally {
            setClaiming(false)
        }
    }

    // Check if already claimed today
    const hasClaimedToday = () => {
        if (!userStats?.lastCheckIn) return false
        const lastCheckIn = new Date(userStats.lastCheckIn)
        const today = new Date()
        return lastCheckIn.toDateString() === today.toDateString()
    }

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

    // Task icons mapping
    const taskIcons: Record<string, typeof CheckCircle> = {
        login: CheckCircle,
        read_1: Star,
        read_5: Zap,
    }

    return (
        <div className="pb-4 sm:py-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-4 sm:mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">Hadiah & Reward</h1>
                    <p className="text-[var(--text-muted)]">
                        Selesaikan tugas harian untuk mendapatkan koin gratis
                    </p>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <div className="card p-3 sm:p-6 text-center">
                        <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mx-auto mb-1 sm:mb-2" />
                        {userStats ? (
                            <p className="text-2xl font-bold">{userStats.coins}</p>
                        ) : (
                            <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                        )}
                        <p className="text-xs sm:text-sm text-[var(--text-muted)]">Koin</p>
                    </div>
                    <div className="card p-3 sm:p-6 text-center">
                        <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mx-auto mb-1 sm:mb-2" />
                        {userStats ? (
                            <p className="text-lg sm:text-2xl font-bold">{userStats.readingStreak}</p>
                        ) : (
                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto animate-spin" />
                        )}
                        <p className="text-xs sm:text-sm text-[var(--text-muted)]">Streak</p>
                    </div>
                    <div className="card p-3 sm:p-6 text-center">
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mx-auto mb-1 sm:mb-2" />
                        {userStats ? (
                            <p className="text-lg sm:text-2xl font-bold">{userStats.referralCount}</p>
                        ) : (
                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto animate-spin" />
                        )}
                        <p className="text-xs sm:text-sm text-[var(--text-muted)]">Referral</p>
                    </div>
                </div>

                {/* Referral Section */}
                <div className="card p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20">
                    <h2 className="font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-500" />
                        Ajak Teman, Dapat Bonus!
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-3 sm:mb-4">
                        Dapat <span className="text-amber-500 font-bold">50 koin</span> + <span className="text-amber-600 font-bold">3 hari VIP</span> per teman!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${session?.user?.id?.slice(0, 8)}...`}
                            className="input flex-1 text-xs sm:text-sm bg-[var(--bg-tertiary)]"
                        />
                        <button
                            onClick={handleCopyReferral}
                            className={`btn text-sm ${copied ? "bg-green-500 hover:bg-green-600" : "btn-primary"}`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Tersalin!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-1" />
                                    Salin Link
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
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                            const currentStreak = Math.min(userStats?.readingStreak || 0, 7)
                            const isCompleted = day <= currentStreak
                            const isToday = day === currentStreak + 1 && !hasClaimedToday()

                            return (
                                <div
                                    key={day}
                                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm ${isCompleted
                                        ? "bg-green-500 text-white"
                                        : isToday
                                            ? "bg-[var(--color-primary)] text-white animate-pulse"
                                            : "bg-[var(--bg-tertiary)]"
                                        }`}
                                >
                                    <span className="text-xs">Hari</span>
                                    <span className="font-bold">{day}</span>
                                    {isCompleted && <CheckCircle className="w-3 h-3" />}
                                </div>
                            )
                        })}
                    </div>

                    {claimMessage && (
                        <div className={`mt-3 p-3 rounded-lg text-center text-sm ${claimMessage.type === "success"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}>
                            {claimMessage.text}
                        </div>
                    )}

                    <button
                        onClick={claimDaily}
                        disabled={claiming || hasClaimedToday()}
                        className={`btn w-full mt-4 ${hasClaimedToday()
                            ? "bg-green-500 hover:bg-green-500 cursor-not-allowed"
                            : "btn-primary"
                            }`}
                    >
                        {claiming ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : hasClaimedToday() ? (
                            <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                            <Gift className="w-4 h-4 mr-2" />
                        )}
                        {hasClaimedToday() ? "Sudah Klaim Hari Ini ✓" : "Klaim Hadiah Hari Ini"}
                    </button>
                </div>

                {/* Daily Tasks */}
                <div className="card p-6">
                    <h2 className="font-bold text-lg mb-4">Tugas Harian</h2>
                    <div className="space-y-3">
                        {dailyTasks.length === 0 ? (
                            <div className="text-center py-4 text-[var(--text-muted)]">
                                <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
                                <p>Memuat tugas...</p>
                            </div>
                        ) : (
                            dailyTasks.map((task) => {
                                const TaskIcon = taskIcons[task.id] || CheckCircle
                                return (
                                    <div
                                        key={task.id}
                                        className={`flex items-center justify-between p-4 rounded-lg ${task.claimed
                                                ? "bg-green-500/10 border border-green-500/20"
                                                : task.completed
                                                    ? "bg-amber-500/10 border border-amber-500/20"
                                                    : "bg-[var(--bg-tertiary)]"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <TaskIcon
                                                className={`w-5 h-5 ${task.claimed
                                                        ? "text-green-500"
                                                        : task.completed
                                                            ? "text-amber-500"
                                                            : "text-[var(--text-muted)]"
                                                    }`}
                                            />
                                            <span className={task.claimed ? "line-through text-[var(--text-muted)]" : ""}>
                                                {task.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Coins className="w-4 h-4" />
                                                <span className="font-medium">+{task.reward}</span>
                                            </div>
                                            {task.claimed ? (
                                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                                    Diklaim ✓
                                                </span>
                                            ) : task.canClaim ? (
                                                <button
                                                    onClick={() => claimTask(task.id)}
                                                    disabled={claimingTask === task.id}
                                                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded transition-colors"
                                                >
                                                    {claimingTask === task.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        "Klaim"
                                                    )}
                                                </button>
                                            ) : !task.completed && (
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    Belum selesai
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
