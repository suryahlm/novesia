import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// Verify Midtrans signature
function verifySignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string, signatureKey: string): boolean {
    const payload = orderId + statusCode + grossAmount + serverKey
    const hash = crypto.createHash("sha512").update(payload).digest("hex")
    return hash === signatureKey
}

// POST - Midtrans notification webhook
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            order_id: orderId,
            status_code: statusCode,
            gross_amount: grossAmount,
            signature_key: signatureKey,
            transaction_status: transactionStatus,
            fraud_status: fraudStatus,
        } = body

        // Verify signature
        const serverKey = process.env.MIDTRANS_SERVER_KEY || ""
        const isValid = verifySignature(orderId, statusCode, grossAmount, serverKey, signatureKey)

        if (!isValid) {
            console.error("Invalid signature for order:", orderId)
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
        }

        // Find the transaction
        const transaction = await prisma.transaction.findUnique({
            where: { id: orderId },
        })

        if (!transaction) {
            console.error("Transaction not found:", orderId)
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
        }

        // Already processed
        if (transaction.status === "SUCCESS") {
            return NextResponse.json({ message: "Already processed" })
        }

        // Parse metadata
        const metadata = transaction.metadata as {
            type: string
            coinsToGrant: number
            vipDays: number
        } | null

        // Handle transaction status
        if (transactionStatus === "capture" || transactionStatus === "settlement") {
            if (fraudStatus === "accept" || !fraudStatus) {
                // Payment successful - grant rewards
                await prisma.$transaction(async (tx) => {
                    // Update transaction status
                    await tx.transaction.update({
                        where: { id: orderId },
                        data: { status: "SUCCESS" },
                    })

                    if (metadata?.type === "coin" && metadata.coinsToGrant > 0) {
                        // Grant coins
                        await tx.user.update({
                            where: { id: transaction.userId },
                            data: { coins: { increment: metadata.coinsToGrant } },
                        })
                    } else if (metadata?.type === "vip" && metadata.vipDays > 0) {
                        // Grant VIP
                        const user = await tx.user.findUnique({
                            where: { id: transaction.userId },
                            select: { isVip: true, vipExpiresAt: true },
                        })

                        const now = new Date()
                        let newExpiry: Date

                        if (user?.isVip && user.vipExpiresAt && user.vipExpiresAt > now) {
                            newExpiry = new Date(user.vipExpiresAt.getTime() + metadata.vipDays * 24 * 60 * 60 * 1000)
                        } else {
                            newExpiry = new Date(now.getTime() + metadata.vipDays * 24 * 60 * 60 * 1000)
                        }

                        await tx.user.update({
                            where: { id: transaction.userId },
                            data: {
                                isVip: true,
                                vipExpiresAt: newExpiry,
                            },
                        })
                    }
                })

                console.log("Payment successful for order:", orderId)
            }
        } else if (transactionStatus === "deny" || transactionStatus === "cancel" || transactionStatus === "expire") {
            // Payment failed
            await prisma.transaction.update({
                where: { id: orderId },
                data: { status: "FAILED" },
            })

            console.log("Payment failed for order:", orderId, transactionStatus)
        } else if (transactionStatus === "pending") {
            // Still pending, do nothing
            console.log("Payment pending for order:", orderId)
        }

        return NextResponse.json({ message: "OK" })
    } catch (error) {
        console.error("Error processing webhook:", error)
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
    }
}
