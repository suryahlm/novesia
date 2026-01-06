import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BADGES, getBadgeById } from "@/lib/badges"

// GET - Get user's badges
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's unlocked badges
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: session.user.id },
            orderBy: { unlockedAt: "desc" },
        })

        // Map to full badge info
        const unlockedBadges = userBadges.map(ub => ({
            ...getBadgeById(ub.badgeId),
            unlockedAt: ub.unlockedAt,
        })).filter(b => b.id) // Filter out any undefined badges

        // Get all badges with locked status
        const allBadges = BADGES.map(badge => ({
            ...badge,
            unlocked: userBadges.some(ub => ub.badgeId === badge.id),
            unlockedAt: userBadges.find(ub => ub.badgeId === badge.id)?.unlockedAt || null,
        }))

        return NextResponse.json({
            unlocked: unlockedBadges,
            all: allBadges,
            totalUnlocked: unlockedBadges.length,
            totalBadges: BADGES.length,
        })
    } catch (error) {
        console.error("Error fetching badges:", error)
        return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 })
    }
}

// POST - Check and award badges based on user actions
export async function POST() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id
        const newBadges: string[] = []

        // Get user stats
        const [
            chaptersReadCount,
            commentsCount,
            user,
            existingBadges,
        ] = await Promise.all([
            prisma.readingHistory.count({ where: { userId } }),
            prisma.comment.count({ where: { userId } }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { readingStreak: true, isVip: true, createdAt: true }
            }),
            prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
        ])

        const unlockedIds = new Set(existingBadges.map(b => b.badgeId))

        // Helper to award badge
        const awardBadge = async (badgeId: string) => {
            if (!unlockedIds.has(badgeId)) {
                await prisma.userBadge.create({
                    data: { userId, badgeId },
                })
                newBadges.push(badgeId)
                unlockedIds.add(badgeId)
            }
        }

        // Check reading badges
        if (chaptersReadCount >= 1) await awardBadge("first_chapter")
        if (chaptersReadCount >= 10) await awardBadge("bookworm_10")
        if (chaptersReadCount >= 50) await awardBadge("reader_50")
        if (chaptersReadCount >= 100) await awardBadge("scholar_100")
        if (chaptersReadCount >= 500) await awardBadge("master_500")

        // Check social badges
        if (commentsCount >= 1) await awardBadge("first_comment")

        // Check streak badges
        if (user?.readingStreak && user.readingStreak >= 7) await awardBadge("streak_7")
        if (user?.readingStreak && user.readingStreak >= 30) await awardBadge("streak_30")

        // Check VIP badge
        if (user?.isVip) await awardBadge("vip_member")

        // Check time-based badges (based on current time)
        const currentHour = new Date().getHours()
        if (currentHour >= 0 && currentHour < 5) await awardBadge("night_owl")
        if (currentHour >= 5 && currentHour < 8) await awardBadge("early_bird")

        // Check founding member (joined before 2026-02-01)
        if (user?.createdAt && new Date(user.createdAt) < new Date("2026-02-01")) {
            await awardBadge("founding_member")
        }

        return NextResponse.json({
            newBadges: newBadges.map(id => getBadgeById(id)),
            totalUnlocked: unlockedIds.size,
        })
    } catch (error) {
        console.error("Error checking badges:", error)
        return NextResponse.json({ error: "Failed to check badges" }, { status: 500 })
    }
}
