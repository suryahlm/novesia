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

// DELETE - Remove job
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
        }

        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 })
        }

        const { id } = await params

        await prisma.scrapeJob.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting scrape job:", error)
        return NextResponse.json(
            { error: "Failed to delete job" },
            { status: 500 }
        )
    }
}

// PATCH - Cancel job
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
        }

        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        if (body.action === "cancel") {
            const job = await prisma.scrapeJob.update({
                where: { id },
                data: {
                    status: "FAILED",
                    error: "Dibatalkan oleh admin",
                    completedAt: new Date(),
                },
            })
            return NextResponse.json({ success: true, job })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error) {
        console.error("Error updating scrape job:", error)
        return NextResponse.json(
            { error: "Failed to update job" },
            { status: 500 }
        )
    }
}
