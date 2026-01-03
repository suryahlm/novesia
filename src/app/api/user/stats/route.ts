import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user stats for rewards page
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                coins: true,
                readingStreak: true,
                lastCheckIn: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Count referrals
        const referralCount = await prisma.referral.count({
            where: { referrerId: session.user.id },
        })

        return NextResponse.json({
            coins: user.coins,
            readingStreak: user.readingStreak,
            lastCheckIn: user.lastCheckIn,
            referralCount,
        })
    } catch (error) {
        console.error("Error fetching user stats:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
