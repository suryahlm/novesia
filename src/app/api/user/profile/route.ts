import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkAndUpdateVipStatus } from "@/lib/vip"

// GET - Get user profile (with VIP expiration check)
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check and update VIP status if expired
        const vipStatus = await checkAndUpdateVipStatus(session.user.id)

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                coins: true,
                isVip: true,
                vipExpiresAt: true,
                readingStreak: true,
                role: true,
                _count: {
                    select: {
                        bookmarks: true,
                        readingHistory: true,
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Return with VIP expiration info
        return NextResponse.json({
            ...user,
            vipWasExpired: vipStatus.wasExpired,
        })
    } catch (error) {
        console.error("Error fetching profile:", error)
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name } = body

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: { name },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("Error updating profile:", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
}
