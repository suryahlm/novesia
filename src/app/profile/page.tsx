"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    User,
    Mail,
    Coins,
    Crown,
    BookOpen,
    Heart,
    Settings,
    LogIn,
    Loader2,
    Save,
    CheckCircle,
    Star,
} from "lucide-react"

interface ProfileData {
    coins: number
    isVip: boolean
    readingStreak: number
    bookmarkCount: number
    readCount: number
}

export default function ProfilePage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [profileData, setProfileData] = useState<ProfileData | null>(null)
    const [formData, setFormData] = useState({
        name: "",
    })

    // Fetch profile data
    useEffect(() => {
        if (session?.user?.id) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    setProfileData({
                        coins: data.coins || 0,
                        isVip: data.isVip || false,
                        readingStreak: data.readingStreak || 0,
                        bookmarkCount: data._count?.bookmarks || 0,
                        readCount: data._count?.readingHistory || 0,
                    })
                })
                .catch(() => {
                    setProfileData({
                        coins: 0,
                        isVip: false,
                        readingStreak: 0,
                        bookmarkCount: 0,
                        readCount: 0,
                    })
                })
        }
    }, [session?.user?.id])

    if (status === "loading") {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Profil Kamu</h1>
                    <p className="text-[var(--text-muted)] mb-6">
                        Masuk untuk melihat profil
                    </p>
                    <Link href="/login" className="btn btn-primary">
                        <LogIn className="w-4 h-4 mr-2" />
                        Masuk
                    </Link>
                </div>
            </div>
        )
    }

    const user = session.user

    const handleEdit = () => {
        setFormData({ name: user?.name || "" })
        setIsEditing(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                await update({ name: formData.name })
                setSaveSuccess(true)
                setIsEditing(false)
                setTimeout(() => setSaveSuccess(false), 3000)
            }
        } catch (error) {
            console.error("Error updating profile:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="pb-4 sm:py-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-4 sm:mb-8">
                    <h1 className="text-3xl font-bold mb-2">Profil Saya</h1>
                    <p className="text-[var(--text-muted)]">
                        Kelola informasi profil kamu
                    </p>
                </div>

                {/* Profile Card */}
                <div className="card p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name || "User"}
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-3xl font-bold">
                                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Nama</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Simpan
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
                                        {profileData?.isVip && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-xs font-bold">
                                                <Crown className="w-3 h-3" />
                                                VIP
                                            </span>
                                        )}
                                        {saveSuccess && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    </div>
                                    <p className="text-[var(--text-muted)] flex items-center justify-center sm:justify-start gap-2 mb-4">
                                        <Mail className="w-4 h-4" />
                                        {user?.email}
                                    </p>
                                    <button onClick={handleEdit} className="btn btn-secondary">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit Profil
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="card p-4 text-center">
                        <Coins className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                        <p className="text-xl font-bold">{profileData?.coins?.toLocaleString() || 0}</p>
                        <p className="text-sm text-[var(--text-muted)]">Koin</p>
                    </div>
                    <div className="card p-4 text-center">
                        <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-xl font-bold">{profileData?.readCount || 0}</p>
                        <p className="text-sm text-[var(--text-muted)]">Dibaca</p>
                    </div>
                    <div className="card p-4 text-center">
                        <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <p className="text-xl font-bold">{profileData?.bookmarkCount || 0}</p>
                        <p className="text-sm text-[var(--text-muted)]">Bookmark</p>
                    </div>
                    <div className="card p-4 text-center">
                        {profileData?.isVip ? (
                            <>
                                <Crown className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                                <p className="text-xl font-bold text-amber-500">VIP</p>
                                <p className="text-sm text-[var(--text-muted)]">Member</p>
                            </>
                        ) : (
                            <>
                                <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                <p className="text-xl font-bold">{profileData?.readingStreak || 0}</p>
                                <p className="text-sm text-[var(--text-muted)]">Streak</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="card divide-y divide-[var(--bg-tertiary)]">
                    <Link href="/library" className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                            <span>Pustaka Saya</span>
                        </div>
                    </Link>
                    <Link href="/coins" className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                        <div className="flex items-center gap-3">
                            <Coins className="w-5 h-5 text-amber-500" />
                            <span>Beli Koin</span>
                        </div>
                    </Link>
                    <Link href="/rewards" className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                        <div className="flex items-center gap-3">
                            <Crown className="w-5 h-5 text-purple-500" />
                            <span>Hadiah & Reward</span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
