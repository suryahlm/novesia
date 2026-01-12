import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })

        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No novel IDs provided" }, { status: 400 })
        }

        // Delete chapters first (foreign key constraint)
        await prisma.chapter.deleteMany({
            where: { novelId: { in: ids } },
        })

        // Delete novels
        const result = await prisma.novel.deleteMany({
            where: { id: { in: ids } },
        })

        return NextResponse.json({
            deleted: result.count,
            message: `Successfully deleted ${result.count} novels`
        })
    } catch (error) {
        console.error("Error bulk deleting novels:", error)
        return NextResponse.json(
            { error: "Failed to delete novels" },
            { status: 500 }
        )
    }
}
