"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Crown, Check } from "lucide-react"

export default function VipButton() {
    const { data: session } = useSession()
    const [isVip, setIsVip] = useState(false)

    useEffect(() => {
        if (session?.user?.id) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    setIsVip(data.isVip || false)
                })
                .catch(() => setIsVip(false))
        }
    }, [session?.user?.id])

    if (isVip) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-medium">
                <Check className="w-4 h-4" />
                Anda Sudah VIP
            </div>
        )
    }

    return (
        <Link
            href="/rewards"
            className="btn border-2 border-white/50 hover:bg-white/10"
        >
            <Crown className="w-4 h-4 mr-2" />
            Gabung VIP
        </Link>
    )
}
