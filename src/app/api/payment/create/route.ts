import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createSnapTransaction } from "@/lib/midtrans"

// POST - Create a new payment transaction
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { type, packageId } = body

        if (!type || !packageId) {
            return NextResponse.json({ error: "Missing type or packageId" }, { status: 400 })
        }

        let itemName = ""
        let grossAmount = 0
        let itemId = ""
        let coinsToGrant = 0
        let vipDays = 0

        if (type === "coin") {
            // Coin packages
            const coinPackage = await prisma.coinPackage.findUnique({
                where: { id: packageId },
            })

            if (!coinPackage) {
                return NextResponse.json({ error: "Package not found" }, { status: 404 })
            }

            itemName = coinPackage.name
            grossAmount = coinPackage.priceIdr
            itemId = `coin_${packageId}`
            coinsToGrant = coinPackage.coins + coinPackage.bonus
        } else if (type === "vip") {
            // VIP packages
            const vipPackages: Record<string, { name: string; price: number; days: number }> = {
                vip_1_month: { name: "VIP 1 Bulan", price: 49000, days: 30 },
                vip_3_months: { name: "VIP 3 Bulan", price: 127000, days: 90 },
                vip_1_year: { name: "VIP 1 Tahun", price: 399000, days: 365 },
            }

            const vipPkg = vipPackages[packageId]
            if (!vipPkg) {
                return NextResponse.json({ error: "VIP package not found" }, { status: 404 })
            }

            itemName = vipPkg.name
            grossAmount = vipPkg.price
            itemId = packageId
            vipDays = vipPkg.days
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 })
        }

        // Generate unique order ID
        const orderId = `NOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Create Midtrans transaction
        const transaction = await createSnapTransaction({
            orderId,
            grossAmount,
            customerName: session.user.name || "User",
            customerEmail: session.user.email,
            itemName,
            itemId,
        })

        // Save pending transaction to database
        await prisma.transaction.create({
            data: {
                id: orderId,
                userId: session.user.id,
                type: type === "vip" ? "VIP_SUBSCRIPTION" : "COIN_PURCHASE",
                amount: type === "vip" ? vipDays : coinsToGrant,
                description: `Pembelian ${itemName}`,
                paymentId: orderId,
                status: "PENDING",
                metadata: {
                    type,
                    packageId,
                    grossAmount,
                    coinsToGrant: type === "coin" ? coinsToGrant : 0,
                    vipDays: type === "vip" ? vipDays : 0,
                },
            },
        })

        return NextResponse.json({
            success: true,
            token: transaction.token,
            redirectUrl: transaction.redirect_url,
            orderId,
        })
    } catch (error) {
        console.error("Error creating payment:", error)
        return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
    }
}
