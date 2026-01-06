"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
    Crown,
    Check,
    Zap,
    BookOpen,
    Star,
    Shield,
    Gift,
    LogIn,
    Loader2
} from "lucide-react"

interface PricingPlan {
    id: string
    name: string
    price: number
    coinPrice: number
    duration: string
    popular: boolean
    features: string[]
    savings?: string
}

const vipBenefits = [
    { icon: BookOpen, title: "Novel Premium", desc: "Akses ribuan novel premium tanpa batas" },
    { icon: Zap, title: "Bebas Iklan", desc: "Pengalaman baca tanpa gangguan iklan" },
    { icon: Gift, title: "Bonus Koin", desc: "Dapatkan bonus koin setiap bulan" },
    { icon: Star, title: "Chapter Awal", desc: "Baca chapter terbaru lebih awal" },
    { icon: Shield, title: "Badge VIP", desc: "Badge eksklusif di profil kamu" },
]

export default function PricingPage() {
    const { data: session, status } = useSession()
    const [selectedPlan, setSelectedPlan] = useState<string>("quarterly")
    const [isLoading, setIsLoading] = useState(false)
    const [purchaseStatus, setPurchaseStatus] = useState<{ success?: boolean; message?: string } | null>(null)
    const [pricesLoading, setPricesLoading] = useState(true)
    const [userCoins, setUserCoins] = useState<number>(0)
    const [currentVip, setCurrentVip] = useState<{ isVip: boolean; expiresAt: string | null } | null>(null)
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; planId: string | null; plan: PricingPlan | null }>({ open: false, planId: null, plan: null })
    const [paymentMethod, setPaymentMethod] = useState<"coins" | "midtrans">("midtrans")
    const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
        {
            id: "monthly",
            name: "Bulanan",
            price: 49000,
            coinPrice: 550,
            duration: "bulan",
            popular: false,
            features: [
                "Akses semua novel premium",
                "Bebas iklan",
                "50 koin bonus/bulan",
                "Badge VIP eksklusif",
            ],
        },
        {
            id: "quarterly",
            name: "3 Bulan",
            price: 127000,
            coinPrice: 1400,
            duration: "3 bulan",
            popular: true,
            savings: "Hemat 14%",
            features: [
                "Akses semua novel premium",
                "Bebas iklan",
                "200 koin bonus",
                "Badge VIP eksklusif",
                "Akses chapter lebih awal",
            ],
        },
        {
            id: "yearly",
            name: "Tahunan",
            price: 399000,
            coinPrice: 4500,
            duration: "tahun",
            popular: false,
            savings: "Hemat 32%",
            features: [
                "Akses semua novel premium",
                "Bebas iklan",
                "1000 koin bonus",
                "Badge VIP eksklusif",
                "Akses chapter lebih awal",
                "Prioritas support",
            ],
        },
    ])

    useEffect(() => {
        // Fetch prices from settings
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                const monthlyPrice = data.vipMonthlyPrice || 49000
                const quarterlyPrice = data.vipQuarterlyPrice || 120000
                const yearlyPrice = data.vipYearlyPrice || 399000

                // Calculate savings
                const quarterlySavings = Math.round((1 - quarterlyPrice / (monthlyPrice * 3)) * 100)
                const yearlySavings = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100)

                setPricingPlans(prev => prev.map(plan => {
                    if (plan.id === "monthly") return { ...plan, price: monthlyPrice }
                    if (plan.id === "quarterly") return {
                        ...plan,
                        price: quarterlyPrice,
                        savings: quarterlySavings > 0 ? `Hemat ${quarterlySavings}%` : undefined
                    }
                    if (plan.id === "yearly") return {
                        ...plan,
                        price: yearlyPrice,
                        savings: yearlySavings > 0 ? `Hemat ${yearlySavings}%` : undefined
                    }
                    return plan
                }))
            })
            .catch(console.error)
            .finally(() => setPricesLoading(false))

        // Fetch VIP status and user coins if logged in
        if (session?.user) {
            fetch("/api/user/vip")
                .then(res => res.json())
                .then(data => {
                    setUserCoins(data.userCoins || 0)
                    setCurrentVip(data.currentVip || null)
                })
                .catch(console.error)
        }
    }, [session])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price)
    }

    // Open confirmation modal
    const handleSelectPlan = (planId: string) => {
        if (!session) {
            window.location.href = "/login?redirect=/pricing"
            return
        }

        const plan = pricingPlans.find(p => p.id === planId)
        if (!plan) return

        // Show confirmation modal
        setConfirmModal({ open: true, planId, plan })
        setPaymentMethod("midtrans") // Default to real money
    }

    // Pay with coins
    const payWithCoins = async () => {
        if (!confirmModal.planId || !confirmModal.plan) return

        const packageMap: Record<string, string> = {
            monthly: "vip_1_month",
            quarterly: "vip_3_months",
            yearly: "vip_1_year",
        }

        const coinsNeeded = confirmModal.plan.coinPrice

        if (userCoins < coinsNeeded) {
            setPurchaseStatus({
                success: false,
                message: `Koin tidak cukup! Butuh ${coinsNeeded.toLocaleString()} koin.`
            })
            setConfirmModal({ open: false, planId: null, plan: null })
            return
        }

        setConfirmModal({ open: false, planId: null, plan: null })
        setIsLoading(true)
        setPurchaseStatus(null)

        try {
            const res = await fetch("/api/user/vip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId: packageMap[confirmModal.planId] }),
            })

            const data = await res.json()

            if (data.success) {
                setPurchaseStatus({ success: true, message: data.message })
                setCurrentVip({ isVip: true, expiresAt: data.vipExpiresAt })
                setUserCoins(prev => prev - coinsNeeded)
            } else {
                setPurchaseStatus({ success: false, message: data.error || "Gagal membeli VIP" })
            }
        } catch (error) {
            setPurchaseStatus({ success: false, message: "Terjadi kesalahan" })
        } finally {
            setIsLoading(false)
        }
    }

    // Pay with Midtrans (real money)
    const payWithMidtrans = async () => {
        if (!confirmModal.planId || !confirmModal.plan) return

        const packageMap: Record<string, string> = {
            monthly: "vip_1_month",
            quarterly: "vip_3_months",
            yearly: "vip_1_year",
        }

        setConfirmModal({ open: false, planId: null, plan: null })
        setIsLoading(true)
        setPurchaseStatus(null)

        try {
            const res = await fetch("/api/payment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "vip",
                    packageId: packageMap[confirmModal.planId],
                }),
            })

            const data = await res.json()

            if (data.success && data.redirectUrl) {
                // Redirect to Midtrans payment page
                window.location.href = data.redirectUrl
            } else {
                setPurchaseStatus({ success: false, message: data.error || "Gagal membuat pembayaran" })
                setIsLoading(false)
            }
        } catch (error) {
            setPurchaseStatus({ success: false, message: "Terjadi kesalahan" })
            setIsLoading(false)
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    return (
        <div className="pb-4 sm:py-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 mb-4">
                        <Crown className="w-5 h-5" />
                        <span className="font-medium">VIP Membership</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                        Upgrade ke <span className="gradient-text">VIP</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                        Nikmati pengalaman membaca premium tanpa batas.
                        Akses ribuan novel eksklusif dan fitur spesial lainnya.
                    </p>
                </div>

                {/* Current VIP Status */}
                {session && currentVip?.isVip && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-600 font-medium">
                            <Crown className="w-5 h-5" />
                            <span>Kamu sudah VIP!</span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            Aktif sampai: {new Date(currentVip.expiresAt!).toLocaleDateString("id-ID", {
                                day: "numeric", month: "long", year: "numeric"
                            })}
                        </p>
                    </div>
                )}

                {/* User Coins */}
                {session && (
                    <div className="mb-6 text-center">
                        <span className="text-sm text-[var(--text-muted)]">Koin kamu: </span>
                        <span className="font-bold text-amber-500">{userCoins.toLocaleString()}</span>
                        <Link href="/coins" className="ml-2 text-sm text-[var(--color-primary)] hover:underline">
                            + Beli Koin
                        </Link>
                    </div>
                )}

                {/* Purchase Status */}
                {purchaseStatus && (
                    <div className={`mb-6 p-4 rounded-xl text-center ${purchaseStatus.success
                        ? "bg-green-500/10 border border-green-500/30 text-green-600"
                        : "bg-red-500/10 border border-red-500/30 text-red-600"
                        }`}>
                        {purchaseStatus.message}
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-12 pt-8">
                    {pricingPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`card p-5 sm:p-6 relative flex flex-col ${plan.popular
                                ? "ring-2 ring-[var(--color-primary)] mt-0 sm:scale-[1.02]"
                                : "mt-4 sm:mt-0"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                    <span className="badge badge-primary px-3 py-1 whitespace-nowrap shadow-md">
                                        ⭐ Paling Populer
                                    </span>
                                </div>
                            )}

                            {plan.savings && (
                                <div className="absolute top-3 right-3">
                                    <span className="badge bg-green-500 text-white text-xs">
                                        {plan.savings}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-4 pt-2">
                                <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-2xl sm:text-3xl font-bold">
                                        {formatPrice(plan.price)}
                                    </span>
                                    <span className="text-sm text-[var(--text-muted)]">
                                        /{plan.duration}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-2 mb-6 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={isLoading}
                                className={`btn w-full ${plan.popular ? "btn-primary" : "btn-secondary"
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : session ? (
                                    "Pilih Paket"
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Masuk Dulu
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* VIP Benefits */}
                <div className="card p-6 sm:p-8 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
                    <h2 className="text-xl font-bold text-center mb-6">
                        Keuntungan Member VIP
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {vipBenefits.map((benefit, idx) => (
                            <div key={idx} className="text-center">
                                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                                    <benefit.icon className="w-6 h-6 text-[var(--color-primary)]" />
                                </div>
                                <h4 className="font-medium text-sm mb-1">{benefit.title}</h4>
                                <p className="text-xs text-[var(--text-muted)]">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-12 text-center">
                    <p className="text-[var(--text-muted)]">
                        Ada pertanyaan?{" "}
                        <Link href="/contact" className="text-[var(--color-primary)] hover:underline">
                            Hubungi kami
                        </Link>
                    </p>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.open && confirmModal.plan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmModal({ open: false, planId: null, plan: null })}>
                    <div className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-center mb-4">Konfirmasi Pembelian</h3>

                        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-4">
                            <div className="text-center">
                                <Crown className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                                <p className="font-bold text-lg">{confirmModal.plan.name}</p>
                                <p className="text-2xl font-bold text-[var(--color-primary)]">{formatPrice(confirmModal.plan.price)}</p>
                            </div>
                        </div>

                        <div className="text-sm text-center mb-4">
                            <p className="text-[var(--text-muted)] mb-2">Pilih metode pembayaran:</p>
                        </div>

                        <div className="space-y-3">
                            {/* Pay with Midtrans (Real Money) */}
                            <button
                                onClick={payWithMidtrans}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                                💳 Bayar {formatPrice(confirmModal.plan.price)}
                            </button>

                            {/* Pay with Coins */}
                            <button
                                onClick={payWithCoins}
                                disabled={userCoins < confirmModal.plan.coinPrice}
                                className="btn btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                🪙 Pakai {confirmModal.plan.coinPrice.toLocaleString()} Koin
                                {userCoins < confirmModal.plan.coinPrice && (
                                    <span className="text-xs text-red-500">(tidak cukup)</span>
                                )}
                            </button>

                            {/* Cancel */}
                            <button
                                onClick={() => setConfirmModal({ open: false, planId: null, plan: null })}
                                className="btn w-full text-[var(--text-muted)]"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
