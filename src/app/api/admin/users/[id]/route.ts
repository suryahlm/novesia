import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

// Helper to verify admin from database
async function verifyAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    return user?.role === "ADMIN"
}

// Delete user - most relations have onDelete: Cascade so just delete the user
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

        // Check if user exists
        const userToDelete = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true },
        })

        if (!userToDelete) {
            return NextResponse.json(
                { error: "User tidak ditemukan" },
                { status: 404 }
            )
        }

        // Delete user - cascade will handle related records
        await prisma.user.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: `User ${userToDelete.email} berhasil dihapus`
        })
    } catch (error) {
        console.error("Error deleting user:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json(
            { error: `Gagal menghapus user: ${errorMessage}` },
            { status: 500 }
        )
    }
}

// Update user (VIP status, coins, password, etc.)
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

        // Set coins directly (via setCoins or coins)
        if (typeof body.setCoins === "number") {
            updateData.coins = body.setCoins
        } else if (typeof body.coins === "number") {
            updateData.coins = body.coins
        }

        // Update role
        if (body.role === "ADMIN" || body.role === "USER") {
            updateData.role = body.role
        }

        // Change password
        if (typeof body.newPassword === "string" && body.newPassword.length >= 8) {
            const hashedPassword = await bcrypt.hash(body.newPassword, 12)
            updateData.password = hashedPassword
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
