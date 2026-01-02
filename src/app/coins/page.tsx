"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Coins, Crown, Gift, Zap, LogIn, Check } from "lucide-react"

const coinPackages = [
    { id: 1, name: "Starter", coins: 50, price: 10000, bonus: 0 },
    { id: 2, name: "Popular", coins: 120, price: 20000, bonus: 20, isPopular: true },
    { id: 3, name: "Best Value", coins: 350, price: 50000, bonus: 100 },
    { id: 4, name: "Premium", coins: 800, price: 100000, bonus: 300 },
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
                        <span className="text-4xl font-bold">50</span>
                    </div>
                </div>

                {/* Coin Packages */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        Paket Koin
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {coinPackages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`card p-6 relative ${pkg.isPopular
                                        ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/5"
                                        : ""
                                    }`}
                            >
                                {pkg.isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--color-primary)] text-white text-xs font-medium rounded-full">
                                        Paling Populer
                                    </div>
                                )}
                                <div className="text-center">
                                    <h3 className="font-bold text-lg mb-2">{pkg.name}</h3>
                                    <div className="flex items-center justify-center gap-1 text-3xl font-bold text-amber-500 mb-1">
                                        <Coins className="w-6 h-6" />
                                        {pkg.coins}
                                    </div>
                                    {pkg.bonus > 0 && (
                                        <p className="text-sm text-green-500 mb-3">
                                            +{pkg.bonus} bonus koin
                                        </p>
                                    )}
                                    <p className="text-2xl font-bold mb-4">
                                        Rp {pkg.price.toLocaleString("id-ID")}
                                    </p>
                                    <button className="btn btn-primary w-full">
                                        <Zap className="w-4 h-4 mr-2" />
                                        Beli Sekarang
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
                                <p className="text-3xl font-bold mb-1">Rp 15.000</p>
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
