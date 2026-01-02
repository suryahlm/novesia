"use client"

import { useState, useEffect } from "react"
import { Users, Crown, Coins, Shield, Mail, Trash2, Plus, RefreshCw } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface User {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    isVip: boolean
    coins: number
    createdAt: string
    _count: {
        readingHistory: number
        bookmarks: number
    }
}

interface Stats {
    total: number
    vipCount: number
    adminCount: number
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, vipCount: 0, adminCount: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showAddCoinsModal, setShowAddCoinsModal] = useState<string | null>(null)
    const [coinsToAdd, setCoinsToAdd] = useState(100)
    const [error, setError] = useState<string | null>(null)

    const fetchUsers = async () => {
        setError(null)
        try {
            const res = await fetch("/api/admin/users", {
                credentials: "include",
            })

            if (!res.ok) {
                const errorData = await res.json()
                setError(errorData.error || `Error ${res.status}`)
                console.error("API Error:", errorData)
                return
            }

            const data = await res.json()
            setUsers(data.users || [])
            setStats(data.stats || { total: 0, vipCount: 0, adminCount: 0 })
        } catch (err) {
            console.error("Fetch error:", err)
            setError("Gagal mengambil data user")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Hapus user ${email}? Aksi ini tidak bisa dibatalkan.`)) return

        setActionLoading(id)
        try {
            console.log("Deleting user:", id)
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE",
                credentials: "include",
            })
            console.log("Delete response status:", res.status)

            if (res.ok) {
                console.log("Delete successful")
                fetchUsers()
            } else {
                const data = await res.json()
                console.error("Delete error:", data)
                alert(data.error || "Gagal menghapus user")
            }
        } catch (error) {
            console.error("Delete exception:", error)
            alert("Terjadi kesalahan")
        } finally {
            setActionLoading(null)
        }
    }

    const handleToggleVip = async (id: string, currentVip: boolean) => {
        setActionLoading(id)
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isVip: !currentVip }),
            })
            if (res.ok) {
                fetchUsers()
            } else {
                const data = await res.json()
                alert(data.error || "Gagal mengubah status VIP")
            }
        } catch (error) {
            alert("Gagal mengubah status VIP")
        } finally {
            setActionLoading(null)
        }
    }

    const handleAddCoins = async (id: string) => {
        if (coinsToAdd <= 0) return

        setActionLoading(id)
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ addCoins: coinsToAdd }),
            })
            if (res.ok) {
                fetchUsers()
                setShowAddCoinsModal(null)
                setCoinsToAdd(100)
            } else {
                const data = await res.json()
                alert(data.error || "Gagal menambah koin")
            }
        } catch (error) {
            alert("Gagal menambah koin")
        } finally {
            setActionLoading(null)
        }
    }

    if (isLoading) {
        return (
            <div className="py-6 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--color-primary)]" />
                <p className="text-[var(--text-muted)]">Memuat data...</p>
            </div>
        )
    }

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Kelola User</h1>
                    <p className="text-[var(--text-secondary)]">
                        Total: {stats.total} user
                    </p>
                </div>
                <button
                    onClick={() => { setIsLoading(true); fetchUsers(); }}
                    className="btn btn-secondary"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="card p-4 mb-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <p className="font-medium">Error: {error}</p>
                    <p className="text-sm mt-1">Coba refresh halaman atau cek console untuk detail.</p>
                </div>
            )}

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
                                    <th className="text-left p-4 font-medium text-[var(--text-muted)]">Bergabung</th>
                                    <th className="text-right p-4 font-medium text-[var(--text-muted)]">Aksi</th>
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
                                            <button
                                                onClick={() => handleToggleVip(user.id, user.isVip)}
                                                disabled={actionLoading === user.id}
                                                className={`badge cursor-pointer transition-all hover:scale-105 ${user.isVip ? "badge-vip" : "badge-secondary"
                                                    }`}
                                                title={user.isVip ? "Klik untuk hapus VIP" : "Klik untuk jadikan VIP"}
                                            >
                                                {actionLoading === user.id ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                ) : user.isVip ? (
                                                    "VIP"
                                                ) : (
                                                    "Free"
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="flex items-center gap-1 text-[var(--color-accent)]">
                                                    <Coins className="w-4 h-4" />
                                                    <span>{formatNumber(user.coins)}</span>
                                                </div>
                                                <button
                                                    onClick={() => setShowAddCoinsModal(user.id)}
                                                    className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                                                    title="Tambah Koin"
                                                >
                                                    <Plus className="w-4 h-4 text-green-500" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">
                                            {new Date(user.createdAt).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDelete(user.id, user.email)}
                                                    disabled={actionLoading === user.id}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                                                    title="Hapus User"
                                                >
                                                    {actionLoading === user.id ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Coins Modal */}
            {showAddCoinsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-sm mx-4">
                        <h3 className="font-semibold mb-4">Tambah Koin</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Jumlah Koin</label>
                            <input
                                type="number"
                                value={coinsToAdd}
                                onChange={(e) => setCoinsToAdd(parseInt(e.target.value) || 0)}
                                min="1"
                                className="input"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddCoinsModal(null)}
                                className="btn btn-secondary flex-1"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleAddCoins(showAddCoinsModal)}
                                disabled={actionLoading === showAddCoinsModal || coinsToAdd <= 0}
                                className="btn btn-primary flex-1"
                            >
                                {actionLoading === showAddCoinsModal ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Tambah"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
