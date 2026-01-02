import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Delete user
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Prevent self-deletion
        if (session.user.id === id) {
            return NextResponse.json(
                { error: "Tidak bisa menghapus akun sendiri" },
                { status: 400 }
            )
        }

        await prisma.user.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting user:", error)
        return NextResponse.json(
            { error: "Gagal menghapus user" },
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

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
