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
    ArrowDownRight,
} from "lucide-react"
import { formatNumber, formatRupiah } from "@/lib/utils"

// Demo stats - akan diganti dengan data dari database
const stats = {
    totalNovels: 245,
    totalChapters: 12450,
    totalUsers: 8920,
    totalViews: 1250000,
    activeReaders: 342,
    vipUsers: 156,
    totalCoins: 458000,
    revenue: 2340000,
}

const recentNovels = [
    { id: "1", title: "The Beginning After The End", chapters: 450, views: 125000, status: "Published" },
    { id: "2", title: "Solo Leveling", chapters: 270, views: 98000, status: "Published" },
    { id: "3", title: "Omniscient Reader's Viewpoint", chapters: 551, views: 87000, status: "Published" },
    { id: "4", title: "Lord of Mysteries", chapters: 1432, views: 78000, status: "Scraping" },
]

const recentUsers = [
    { id: "1", name: "John Doe", email: "john@example.com", isVip: true, coins: 250 },
    { id: "2", name: "Jane Smith", email: "jane@example.com", isVip: false, coins: 50 },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", isVip: true, coins: 420 },
]

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
                            {changeType === "positive" ? (
                                <ArrowUpRight className="w-4 h-4" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4" />
                            )}
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

export default function AdminDashboard() {
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
                    change="+12 minggu ini"
                    changeType="positive"
                />
                <StatCard
                    title="Total User"
                    value={formatNumber(stats.totalUsers)}
                    icon={Users}
                    change="+245 minggu ini"
                    changeType="positive"
                />
                <StatCard
                    title="Total Views"
                    value={formatNumber(stats.totalViews)}
                    icon={Eye}
                    change="+18.2%"
                    changeType="positive"
                />
                <StatCard
                    title="User VIP"
                    value={stats.vipUsers}
                    icon={Crown}
                    change="+23 bulan ini"
                    changeType="positive"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                    title="Pembaca Aktif"
                    value={stats.activeReaders}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Total Koin"
                    value={formatNumber(stats.totalCoins)}
                    icon={Coins}
                />
                <StatCard
                    title="Pendapatan (bulan ini)"
                    value={formatRupiah(stats.revenue)}
                    icon={Crown}
                    change="+15.3%"
                    changeType="positive"
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
                        {recentNovels.map((novel) => (
                            <div key={novel.id} className="flex items-center justify-between p-4">
                                <div>
                                    <p className="font-medium">{novel.title}</p>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {novel.chapters} chapters • {formatNumber(novel.views)} views
                                    </p>
                                </div>
                                <span className={`badge ${novel.status === "Published" ? "badge-primary" : "bg-yellow-500 text-white"
                                    }`}>
                                    {novel.status}
                                </span>
                            </div>
                        ))}
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
                        {recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                                        {user.name[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{user.name}</p>
                                            {user.isVip && (
                                                <span className="badge badge-vip text-xs">VIP</span>
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
                        ))}
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
