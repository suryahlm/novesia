"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Coins, Crown, Gift, Zap, LogIn, Check, Loader2 } from "lucide-react"

const coinPackages = [
    { id: 1, name: "Starter", coins: 100, price: 5000, bonus: 0 },
    { id: 2, name: "Basic", coins: 250, price: 10000, bonus: 25 },
    { id: 3, name: "Popular", coins: 500, price: 20000, bonus: 100, isPopular: true },
    { id: 4, name: "Best Value", coins: 1000, price: 40000, bonus: 300 },
    { id: 5, name: "Ultimate", coins: 2500, price: 80000, bonus: 1000 },
]

const vipBenefits = [
    "Akses semua chapter premium",
    "Bebas iklan",
    "Bonus 50 koin per hari",
    "Badge VIP eksklusif",
    "Prioritas support",
]

export default function CoinsPage() {
    const { data: session, status } = useSession()
    const [userCoins, setUserCoins] = useState<number | null>(null)
    const [vipPrice, setVipPrice] = useState(20000) // Default
    const [isLoading, setIsLoading] = useState<number | null>(null) // Track which package is loading
    const [purchaseStatus, setPurchaseStatus] = useState<{ success?: boolean; message?: string } | null>(null)

    useEffect(() => {
        // Fetch VIP price from settings
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => setVipPrice(data.vipMonthlyPrice || 49000))
            .catch(() => setVipPrice(49000))

        if (session) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => setUserCoins(data.coins))
                .catch(() => setUserCoins(50))
        }
    }, [session])

    const handleBuyCoins = async (packageId: number, packageName: string, price: number) => {
        if (!session) {
            window.location.href = "/login?redirect=/coins"
            return
        }

        setIsLoading(packageId)
        setPurchaseStatus(null)

        try {
            const res = await fetch("/api/payment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "coin",
                    packageId: `coin_${packageId}`,
                    packageName,
                    price,
                }),
            })

            const data = await res.json()

            if (data.success && data.redirectUrl) {
                window.location.href = data.redirectUrl
            } else {
                setPurchaseStatus({ success: false, message: data.error || "Gagal membuat pembayaran" })
                setIsLoading(null)
            }
        } catch (error) {
            setPurchaseStatus({ success: false, message: "Terjadi kesalahan" })
            setIsLoading(null)
        }
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
                    <Coins className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Beli Koin</h1>
                    <p className="text-[var(--text-muted)] mb-6">
                        Masuk untuk membeli koin dan unlock chapter premium
                    </p>
                    <Link href="/login" className="btn btn-primary">
                        <LogIn className="w-4 h-4 mr-2" />
                        Masuk
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Beli Koin</h1>
                    <p className="text-[var(--text-muted)]">
                        Pilih paket koin untuk unlock chapter premium
                    </p>
                </div>

                {/* Current Balance */}
                <div className="card p-6 mb-8 text-center bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <p className="text-sm text-[var(--text-muted)] mb-1">Saldo Koin Kamu</p>
                    <div className="flex items-center justify-center gap-2">
                        <Coins className="w-8 h-8 text-amber-500" />
                        {userCoins !== null ? (
                            <span className="text-4xl font-bold">{userCoins}</span>
                        ) : (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Purchase Status Messages */}
                {purchaseStatus && (
                    <div className={`p-4 rounded-lg mb-6 ${purchaseStatus.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {purchaseStatus.message}
                    </div>
                )}

                {/* Coin Packages */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        Paket Koin
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coinPackages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`card p-6 ${pkg.isPopular
                                    ? "ring-2 ring-[var(--color-primary)]"
                                    : ""
                                    }`}
                            >
                                <div className="text-center">
                                    <h3 className="font-bold text-lg mb-2 flex items-center justify-center gap-1">
                                        {pkg.isPopular && <span className="text-amber-500">⭐</span>}
                                        {pkg.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-1 text-3xl font-bold text-amber-500 mb-1">
                                        <Coins className="w-6 h-6" />
                                        {pkg.coins}
                                    </div>
                                    <p className={`text-sm mb-3 h-5 ${pkg.bonus > 0 ? "text-green-500" : "text-transparent"}`}>
                                        {pkg.bonus > 0 ? `+${pkg.bonus} bonus koin` : "-"}
                                    </p>
                                    <p className="text-2xl font-bold mb-4">
                                        Rp {pkg.price.toLocaleString("id-ID")}
                                    </p>
                                    <button
                                        onClick={() => handleBuyCoins(pkg.id, pkg.name, pkg.price)}
                                        disabled={isLoading !== null}
                                        className="btn btn-primary w-full disabled:opacity-50"
                                    >
                                        {isLoading === pkg.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4 mr-2" />
                                                Beli Sekarang
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VIP Subscription */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Crown className="w-5 h-5 text-purple-500" />
                        Langganan VIP
                    </h2>
                    <div className="card p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Crown className="w-6 h-6 text-purple-500" />
                                    VIP Member
                                </h3>
                                <ul className="space-y-2">
                                    {vipBenefits.map((benefit, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-sm text-[var(--text-muted)] mb-1">Mulai dari</p>
                                <p className="text-3xl font-bold mb-1">Rp {vipPrice.toLocaleString("id-ID")}</p>
                                <p className="text-sm text-[var(--text-muted)] mb-4">/bulan</p>
                                <button className="btn bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 w-full md:w-auto">
                                    <Crown className="w-4 h-4 mr-2" />
                                    Upgrade ke VIP
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Free Coins */}
                <div className="mt-8">
                    <div className="card p-6 text-center">
                        <Gift className="w-12 h-12 text-[var(--color-primary)] mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">Dapatkan Koin Gratis!</h3>
                        <p className="text-[var(--text-muted)] mb-4">
                            Selesaikan tugas harian untuk mendapatkan koin gratis
                        </p>
                        <Link href="/rewards" className="btn btn-primary">
                            Lihat Hadiah
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
