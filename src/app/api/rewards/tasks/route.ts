import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to get date range for today in Indonesia timezone (WIB)
function getIndonesiaTodayRange(): { today: Date; tomorrow: Date } {
    const now = new Date()
    // Convert to Indonesia timezone
    const indonesiaTime = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
    const indonesiaDate = new Date(indonesiaTime)

    // Get midnight today in Indonesia
    const today = new Date(indonesiaDate.getFullYear(), indonesiaDate.getMonth(), indonesiaDate.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Convert back to UTC for database comparison
    // Indonesia is UTC+7, so subtract 7 hours
    const todayUTC = new Date(today.getTime() - (7 * 60 * 60 * 1000))
    const tomorrowUTC = new Date(tomorrow.getTime() - (7 * 60 * 60 * 1000))

    return { today: todayUTC, tomorrow: tomorrowUTC }
}

// GET: Get daily tasks status
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get today's date range in Indonesia timezone
        const { today, tomorrow } = getIndonesiaTodayRange()

        // Count chapters COMPLETED today (scroll >=70% or navigated to next)
        const chaptersReadToday = await prisma.readingHistory.count({
            where: {
                userId: user.id,
                completedAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        })

        // Check if tasks were already claimed today
        const claimedTasks = await prisma.dailyTaskClaim.findMany({
            where: {
                userId: user.id,
                claimedAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        })

        const claimedTaskIds = claimedTasks.map(c => c.taskId)

        // Define tasks with dynamic completion status
        const tasks = [
            {
                id: "login",
                label: "Login harian",
                reward: 5,
                completed: true, // Always true if they're logged in
                claimed: claimedTaskIds.includes("login"),
                canClaim: !claimedTaskIds.includes("login"),
            },
            {
                id: "read_1",
                label: "Baca 1 chapter",
                reward: 10,
                completed: chaptersReadToday >= 1,
                claimed: claimedTaskIds.includes("read_1"),
                canClaim: chaptersReadToday >= 1 && !claimedTaskIds.includes("read_1"),
            },
            {
                id: "read_5",
                label: "Baca 5 chapter",
                reward: 30,
                completed: chaptersReadToday >= 5,
                claimed: claimedTaskIds.includes("read_5"),
                canClaim: chaptersReadToday >= 5 && !claimedTaskIds.includes("read_5"),
            },
        ]

        return NextResponse.json({
            tasks,
            chaptersReadToday,
        })
    } catch (error) {
        console.error("Error fetching daily tasks:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST: Claim a daily task reward
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { taskId } = await request.json()

        if (!taskId) {
            return NextResponse.json({ error: "Task ID required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get today's date range in Indonesia timezone
        const { today, tomorrow } = getIndonesiaTodayRange()

        // Check if already claimed today
        const existingClaim = await prisma.dailyTaskClaim.findFirst({
            where: {
                userId: user.id,
                taskId,
                claimedAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        })

        if (existingClaim) {
            return NextResponse.json({ error: "Already claimed today", alreadyClaimed: true }, { status: 400 })
        }

        // Define task rewards
        const taskRewards: Record<string, number> = {
            login: 5,
            read_1: 10,
            read_5: 30,
        }

        const reward = taskRewards[taskId]
        if (!reward) {
            return NextResponse.json({ error: "Invalid task ID" }, { status: 400 })
        }

        // For read tasks, verify completion
        if (taskId === "read_1" || taskId === "read_5") {
            const chaptersReadToday = await prisma.readingHistory.count({
                where: {
                    userId: user.id,
                    completedAt: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
            })

            const requiredChapters = taskId === "read_1" ? 1 : 5
            if (chaptersReadToday < requiredChapters) {
                return NextResponse.json({
                    error: `Belum membaca ${requiredChapters} chapter hari ini`,
                    chaptersRead: chaptersReadToday,
                    required: requiredChapters,
                }, { status: 400 })
            }
        }

        // Create claim record and add coins
        await prisma.$transaction([
            prisma.dailyTaskClaim.create({
                data: {
                    userId: user.id,
                    taskId,
                    reward,
                },
            }),
            prisma.user.update({
                where: { id: user.id },
                data: { coins: { increment: reward } },
            }),
        ])

        return NextResponse.json({
            success: true,
            reward,
            taskId,
        })
    } catch (error) {
        console.error("Error claiming task:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
