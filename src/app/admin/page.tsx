import Link from "next/link"
import {
    BookOpen,
    Users,
    Eye,
    TrendingUp,
    Coins,
    Crown,
    Clock,
    ArrowUpRight,
} from "lucide-react"
import { formatNumber, formatRupiah } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

// Fetch real stats from database
async function getStats() {
    const [
        totalNovels,
        totalChapters,
        totalUsers,
        totalViews,
        vipUsers,
        totalCoins,
    ] = await Promise.all([
        prisma.novel.count(),
        prisma.chapter.count(),
        prisma.user.count(),
        prisma.novel.aggregate({ _sum: { totalViews: true } }),
        prisma.user.count({ where: { isVip: true } }),
        prisma.user.aggregate({ _sum: { coins: true } }),
    ])

    return {
        totalNovels,
        totalChapters,
        totalUsers,
        totalViews: totalViews._sum.totalViews || 0,
        vipUsers,
        totalCoins: totalCoins._sum.coins || 0,
        activeReaders: totalUsers, // Simplified - could track active sessions
        revenue: 0, // Will be calculated from transactions later
    }
}

async function getRecentNovels() {
    const novels = await prisma.novel.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { chapters: true } },
        },
    })

    return novels.map((novel) => ({
        id: novel.id,
        title: novel.title,
        chapters: novel._count.chapters,
        views: novel.totalViews,
        status: novel.status,
    }))
}

async function getRecentUsers() {
    const users = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            isVip: true,
            coins: true,
            role: true,
        },
    })

    return users
}

function StatCard({
    title,
    value,
    icon: Icon,
    change,
    changeType,
}: {
    title: string
    value: string | number
    icon: React.ElementType
    change?: string
    changeType?: "positive" | "negative"
}) {
    return (
        <div className="card p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {change && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === "positive" ? "text-green-500" : "text-red-500"
                            }`}>
                            <ArrowUpRight className="w-4 h-4" />
                            {change}
                        </div>
                    )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
            </div>
        </div>
    )
}

function getStatusBadge(status: string) {
    switch (status) {
        case "COMPLETED":
            return "bg-green-500 text-white"
        case "ONGOING":
            return "badge-primary"
        case "HIATUS":
            return "bg-yellow-500 text-white"
        default:
            return "badge-secondary"
    }
}

export default async function AdminDashboard() {
    const stats = await getStats()
    const recentNovels = await getRecentNovels()
    const recentUsers = await getRecentUsers()

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard Admin</h1>
                    <p className="text-[var(--text-secondary)]">Selamat datang kembali, Admin!</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/novels/new" className="btn btn-primary">
                        + Novel Baru
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Novel"
                    value={formatNumber(stats.totalNovels)}
                    icon={BookOpen}
                />
                <StatCard
                    title="Total User"
                    value={formatNumber(stats.totalUsers)}
                    icon={Users}
                />
                <StatCard
                    title="Total Views"
                    value={formatNumber(stats.totalViews)}
                    icon={Eye}
                />
                <StatCard
                    title="User VIP"
                    value={stats.vipUsers}
                    icon={Crown}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                    title="Total Chapter"
                    value={formatNumber(stats.totalChapters)}
                    icon={BookOpen}
                />
                <StatCard
                    title="Total Koin"
                    value={formatNumber(stats.totalCoins)}
                    icon={Coins}
                />
                <StatCard
                    title="Pembaca Aktif"
                    value={stats.activeReaders}
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Novels */}
                <div className="card">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--bg-tertiary)]">
                        <h2 className="font-semibold">Novel Terbaru</h2>
                        <Link href="/admin/novels" className="text-sm text-[var(--color-primary)] hover:underline">
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="divide-y divide-[var(--bg-tertiary)]">
                        {recentNovels.length === 0 ? (
                            <div className="p-4 text-center text-[var(--text-muted)]">
                                Belum ada novel
                            </div>
                        ) : (
                            recentNovels.map((novel) => (
                                <div key={novel.id} className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-medium">{novel.title}</p>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {novel.chapters} chapters • {formatNumber(novel.views)} views
                                        </p>
                                    </div>
                                    <span className={`badge ${getStatusBadge(novel.status)}`}>
                                        {novel.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Users */}
                <div className="card">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--bg-tertiary)]">
                        <h2 className="font-semibold">User Terbaru</h2>
                        <Link href="/admin/users" className="text-sm text-[var(--color-primary)] hover:underline">
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="divide-y divide-[var(--bg-tertiary)]">
                        {recentUsers.length === 0 ? (
                            <div className="p-4 text-center text-[var(--text-muted)]">
                                Belum ada user
                            </div>
                        ) : (
                            recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                                            {(user.name || user.email)?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{user.name || "User"}</p>
                                                {user.isVip && (
                                                    <span className="badge badge-vip text-xs">VIP</span>
                                                )}
                                                {user.role === "ADMIN" && (
                                                    <span className="badge badge-primary text-xs">Admin</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[var(--color-accent)]">
                                        <Coins className="w-4 h-4" />
                                        <span className="font-medium">{user.coins}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                <Link href="/admin/novels/new" className="card p-4 text-center hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary)]" />
                    <span className="font-medium">Tambah Novel</span>
                </Link>
                <Link href="/admin/scraper" className="card p-4 text-center hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary)]" />
                    <span className="font-medium">Scraper</span>
                </Link>
                <Link href="/admin/users" className="card p-4 text-center hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                    <Users className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary)]" />
                    <span className="font-medium">Kelola User</span>
                </Link>
                <Link href="/admin/settings" className="card p-4 text-center hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary)]" />
                    <span className="font-medium">Statistik</span>
                </Link>
            </div>
        </div>
    )
}
