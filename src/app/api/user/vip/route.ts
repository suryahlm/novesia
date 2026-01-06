import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { grantVip, getVipPackageById, VIP_PACKAGES } from "@/lib/vip"

// GET - Get VIP packages info
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
                isVip: true,
                vipExpiresAt: true
            },
        })

        return NextResponse.json({
            packages: VIP_PACKAGES,
            currentVip: {
                isVip: user?.isVip || false,
                expiresAt: user?.vipExpiresAt || null,
            },
            userCoins: user?.coins || 0,
        })
    } catch (error) {
        console.error("Error fetching VIP packages:", error)
        return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
    }
}

// POST - Purchase VIP with coins
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { packageId } = body

        if (!packageId) {
            return NextResponse.json({ error: "Package ID required" }, { status: 400 })
        }

        const vipPackage = getVipPackageById(packageId)
        if (!vipPackage) {
            return NextResponse.json({ error: "Invalid package" }, { status: 400 })
        }

        // Check user has enough coins
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { coins: true },
        })

        if (!user || user.coins < vipPackage.priceCoins) {
            return NextResponse.json({
                error: "Insufficient coins",
                required: vipPackage.priceCoins,
                current: user?.coins || 0,
            }, { status: 400 })
        }

        // Deduct coins and grant VIP
        await prisma.user.update({
            where: { id: session.user.id },
            data: { coins: { decrement: vipPackage.priceCoins } },
        })

        const vipResult = await grantVip(session.user.id, vipPackage.durationDays)

        // Record transaction
        await prisma.transaction.create({
            data: {
                userId: session.user.id,
                type: "VIP_PURCHASE",
                amount: -vipPackage.priceCoins,
                description: `Pembelian ${vipPackage.name}`,
            },
        })

        return NextResponse.json({
            success: true,
            package: vipPackage,
            vipExpiresAt: vipResult.vipExpiresAt,
            message: `Selamat! Kamu sekarang VIP sampai ${vipResult.vipExpiresAt.toLocaleDateString("id-ID")}`,
        })
    } catch (error) {
        console.error("Error purchasing VIP:", error)
        return NextResponse.json({ error: "Failed to purchase VIP" }, { status: 500 })
    }
}
