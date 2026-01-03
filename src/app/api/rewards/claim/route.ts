import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Claim daily reward
export async function POST() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                lastCheckIn: true,
                readingStreak: true,
                coins: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Check if already claimed today
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        if (user.lastCheckIn) {
            const lastCheckInDate = new Date(
                user.lastCheckIn.getFullYear(),
                user.lastCheckIn.getMonth(),
                user.lastCheckIn.getDate()
            )

            if (lastCheckInDate.getTime() === today.getTime()) {
                return NextResponse.json(
                    { error: "Already claimed today", alreadyClaimed: true },
                    { status: 400 }
                )
            }
        }

        // Calculate streak
        let newStreak = 1
        if (user.lastCheckIn) {
            const lastCheckInDate = new Date(
                user.lastCheckIn.getFullYear(),
                user.lastCheckIn.getMonth(),
                user.lastCheckIn.getDate()
            )
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            if (lastCheckInDate.getTime() === yesterday.getTime()) {
                // Consecutive day - increase streak
                newStreak = user.readingStreak + 1
            }
            // else streak resets to 1
        }

        // Calculate reward based on streak (max 7 days)
        const streakDay = Math.min(newStreak, 7)
        const baseReward = 5
        const bonusReward = (streakDay - 1) * 2 // Day 1: 5, Day 2: 7, Day 3: 9, etc.
        const totalReward = baseReward + bonusReward

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                lastCheckIn: now,
                readingStreak: newStreak,
                coins: { increment: totalReward },
            },
            select: {
                coins: true,
                readingStreak: true,
            },
        })

        return NextResponse.json({
            success: true,
            reward: totalReward,
            streak: updatedUser.readingStreak,
            coins: updatedUser.coins,
            streakDay,
        })
    } catch (error) {
        console.error("Error claiming daily reward:", error)
        return NextResponse.json({ error: "Failed to claim reward" }, { status: 500 })
    }
}
