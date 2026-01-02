import { BarChart3, Eye, Users, BookOpen, TrendingUp, Calendar } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

async function getAnalytics() {
    const [
        totalNovels,
        totalChapters,
        totalUsers,
        totalViews,
        topNovels,
        recentUsers,
    ] = await Promise.all([
        prisma.novel.count(),
        prisma.chapter.count(),
        prisma.user.count(),
        prisma.novel.aggregate({ _sum: { totalViews: true } }),
        prisma.novel.findMany({
            take: 10,
            orderBy: { totalViews: "desc" },
            select: { id: true, title: true, totalViews: true, slug: true },
        }),
        prisma.user.findMany({
            take: 7,
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true },
        }),
    ])

    return {
        totalNovels,
        totalChapters,
        totalUsers,
        totalViews: totalViews._sum.totalViews || 0,
        topNovels,
        recentUsers,
    }
}

export default async function AdminAnalyticsPage() {
    const analytics = await getAnalytics()

    return (
        <div className="py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-[var(--text-secondary)]">
                    Statistik dan performa platform
                </p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[var(--text-muted)] mb-1">Total Novel</p>
                            <p className="text-2xl font-bold">{formatNumber(analytics.totalNovels)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[var(--text-muted)] mb-1">Total Chapter</p>
                            <p className="text-2xl font-bold">{formatNumber(analytics.totalChapters)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[var(--text-muted)] mb-1">Total User</p>
                            <p className="text-2xl font-bold">{formatNumber(analytics.totalUsers)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                </div>
                <div className="card p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-[var(--text-muted)] mb-1">Total Views</p>
                            <p className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Eye className="w-6 h-6 text-orange-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Novels */}
                <div className="card">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--bg-tertiary)]">
                        <h2 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                            Novel Terpopuler
                        </h2>
                    </div>
                    <div className="divide-y divide-[var(--bg-tertiary)]">
                        {analytics.topNovels.length === 0 ? (
                            <div className="p-4 text-center text-[var(--text-muted)]">
                                Belum ada data
                            </div>
                        ) : (
                            analytics.topNovels.map((novel, index) => (
                                <div key={novel.id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? "bg-yellow-500 text-white" :
                                                index === 1 ? "bg-gray-400 text-white" :
                                                    index === 2 ? "bg-amber-600 text-white" :
                                                        "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                            }`}>
                                            {index + 1}
                                        </span>
                                        <span className="font-medium line-clamp-1">{novel.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                                        <Eye className="w-4 h-4" />
                                        <span>{formatNumber(novel.totalViews)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* User Registration Trend */}
                <div className="card">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--bg-tertiary)]">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                            User Baru (7 Terakhir)
                        </h2>
                    </div>
                    <div className="p-4">
                        {analytics.recentUsers.length === 0 ? (
                            <div className="text-center text-[var(--text-muted)] py-8">
                                Belum ada user
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {analytics.recentUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm">User baru</span>
                                        </div>
                                        <span className="text-sm text-[var(--text-muted)]">
                                            {new Date(user.createdAt).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-8 card p-6">
                <h2 className="font-semibold mb-4">Ringkasan Platform</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-3xl font-bold text-[var(--color-primary)]">
                            {analytics.totalChapters > 0
                                ? Math.round(analytics.totalViews / analytics.totalChapters)
                                : 0}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">Rata-rata Views/Chapter</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-[var(--color-primary)]">
                            {analytics.totalNovels > 0
                                ? (analytics.totalChapters / analytics.totalNovels).toFixed(1)
                                : 0}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">Rata-rata Chapter/Novel</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-[var(--color-primary)]">
                            {analytics.totalUsers > 0
                                ? Math.round(analytics.totalViews / analytics.totalUsers)
                                : 0}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">Rata-rata Views/User</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-[var(--color-primary)]">
                            {analytics.totalNovels > 0
                                ? Math.round(analytics.totalViews / analytics.totalNovels)
                                : 0}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">Rata-rata Views/Novel</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
