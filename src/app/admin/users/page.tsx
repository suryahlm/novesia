import { Users, Crown, Coins, Shield, Mail } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

async function getUsers() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isVip: true,
            coins: true,
            createdAt: true,
            _count: {
                select: {
                    readingHistory: true,
                    bookmarks: true,
                },
            },
        },
    })
    return users
}

async function getUserStats() {
    const [total, vipCount, adminCount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isVip: true } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
    ])
    return { total, vipCount, adminCount }
}

export default async function AdminUsersPage() {
    const users = await getUsers()
    const stats = await getUserStats()

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Kelola User</h1>
                    <p className="text-[var(--text-secondary)]">
                        Total: {stats.total} user
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-[var(--text-muted)]">Total User</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.vipCount}</p>
                        <p className="text-sm text-[var(--text-muted)]">User VIP</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.adminCount}</p>
                        <p className="text-sm text-[var(--text-muted)]">Admin</p>
                    </div>
                </div>
            </div>

            {users.length === 0 ? (
                <div className="card p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                    <h3 className="text-lg font-medium mb-2">Belum ada user</h3>
                    <p className="text-[var(--text-muted)]">
                        User akan muncul di sini setelah mendaftar
                    </p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--bg-tertiary)]">
                                    <th className="text-left p-4 font-medium text-[var(--text-muted)]">User</th>
                                    <th className="text-left p-4 font-medium text-[var(--text-muted)]">Role</th>
                                    <th className="text-center p-4 font-medium text-[var(--text-muted)]">Status</th>
                                    <th className="text-center p-4 font-medium text-[var(--text-muted)]">Koin</th>
                                    <th className="text-center p-4 font-medium text-[var(--text-muted)]">Baca</th>
                                    <th className="text-center p-4 font-medium text-[var(--text-muted)]">Bookmark</th>
                                    <th className="text-left p-4 font-medium text-[var(--text-muted)]">Bergabung</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--bg-tertiary)]">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {user.image ? (
                                                    <img
                                                        src={user.image}
                                                        alt={user.name || "User"}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                                                        {(user.name || user.email)?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{user.name || "User"}</p>
                                                    <p className="text-sm text-[var(--text-muted)] flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {user.role === "ADMIN" ? (
                                                <span className="badge badge-primary">Admin</span>
                                            ) : (
                                                <span className="badge badge-secondary">User</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {user.isVip ? (
                                                <span className="badge badge-vip">VIP</span>
                                            ) : (
                                                <span className="text-[var(--text-muted)]">Free</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-[var(--color-accent)]">
                                                <Coins className="w-4 h-4" />
                                                <span>{formatNumber(user.coins)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-[var(--text-secondary)]">
                                            {user._count.readingHistory}
                                        </td>
                                        <td className="p-4 text-center text-[var(--text-secondary)]">
                                            {user._count.bookmarks}
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">
                                            {new Date(user.createdAt).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
