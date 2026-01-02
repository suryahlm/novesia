import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Helper to verify admin from database
async function verifyAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    return user?.role === "ADMIN"
}

// Delete user and all related records
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
        }

        // Verify admin from database
        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 })
        }

        const { id } = await params

        // Prevent self-deletion
        if (session.user.id === id) {
            return NextResponse.json(
                { error: "Tidak bisa menghapus akun sendiri" },
                { status: 400 }
            )
        }

        // Delete in transaction to ensure all related records are deleted
        await prisma.$transaction(async (tx) => {
            // Delete related records first
            await tx.readingHistory.deleteMany({ where: { userId: id } })
            await tx.bookmark.deleteMany({ where: { userId: id } })
            await tx.comment.deleteMany({ where: { userId: id } })
            await tx.rating.deleteMany({ where: { userId: id } })
            await tx.notification.deleteMany({ where: { userId: id } })
            await tx.unlockedChapter.deleteMany({ where: { userId: id } })
            await tx.transaction.deleteMany({ where: { userId: id } })

            // Delete collections (and their items)
            const collections = await tx.collection.findMany({ where: { userId: id } })
            for (const collection of collections) {
                await tx.collectionItem.deleteMany({ where: { collectionId: collection.id } })
            }
            await tx.collection.deleteMany({ where: { userId: id } })

            // Delete referrals
            await tx.referral.deleteMany({ where: { referrerId: id } })
            await tx.referral.deleteMany({ where: { referredId: id } })

            // Finally delete the user (accounts and sessions have cascade)
            await tx.user.delete({ where: { id } })
        })

        return NextResponse.json({ success: true, message: "User berhasil dihapus" })
    } catch (error) {
        console.error("Error deleting user:", error)
        return NextResponse.json(
            { error: `Gagal menghapus user: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 500 }
        )
    }
}

// Update user (VIP status, coins, etc.)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
        }

        // Verify admin from database
        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const updateData: Record<string, unknown> = {}

        // Toggle VIP status
        if (typeof body.isVip === "boolean") {
            updateData.isVip = body.isVip
        }

        // Add coins
        if (typeof body.addCoins === "number" && body.addCoins > 0) {
            const user = await prisma.user.findUnique({
                where: { id },
                select: { coins: true },
            })
            if (user) {
                updateData.coins = user.coins + body.addCoins
            }
        }

        // Set coins directly
        if (typeof body.coins === "number") {
            updateData.coins = body.coins
        }

        // Update role
        if (body.role === "ADMIN" || body.role === "USER") {
            updateData.role = body.role
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "Tidak ada data yang diupdate" },
                { status: 400 }
            )
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                isVip: true,
                coins: true,
                role: true,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Error updating user:", error)
        return NextResponse.json(
            { error: "Gagal mengupdate user" },
            { status: 500 }
        )
    }
}
