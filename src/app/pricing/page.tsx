"use client"

import { useState } from "react"
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
    duration: string
    popular: boolean
    features: string[]
    savings?: string
}

const pricingPlans: PricingPlan[] = [
    {
        id: "monthly",
        name: "Bulanan",
        price: 15000,
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
        price: 39000,
        duration: "3 bulan",
        popular: true,
        savings: "Hemat 13%",
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
        price: 120000,
        duration: "tahun",
        popular: false,
        savings: "Hemat 33%",
        features: [
            "Akses semua novel premium",
            "Bebas iklan",
            "1000 koin bonus",
            "Badge VIP eksklusif",
            "Akses chapter lebih awal",
            "Prioritas support",
        ],
    },
]

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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price)
    }

    const handleSubscribe = async (planId: string) => {
        if (!session) {
            window.location.href = "/login?redirect=/pricing"
            return
        }

        setIsLoading(true)
        // TODO: Integrate with payment gateway
        alert("Fitur pembayaran akan segera tersedia!")
        setIsLoading(false)
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
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

                {/* Pricing Cards */}
                <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
                    {pricingPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`card p-5 sm:p-6 relative ${plan.popular
                                    ? "ring-2 ring-[var(--color-primary)] scale-[1.02]"
                                    : ""
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="badge badge-primary px-3 py-1">
                                        Paling Populer
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

                            <div className="text-center mb-4">
                                <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-3xl font-bold">
                                        {formatPrice(plan.price)}
                                    </span>
                                    <span className="text-sm text-[var(--text-muted)]">
                                        /{plan.duration}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-2 mb-6">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
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
        </div>
    )
}
