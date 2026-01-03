import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get all genres
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })
        if (user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const genres = await prisma.genre.findMany({
            include: {
                _count: { select: { novels: true } },
            },
            orderBy: { name: "asc" },
        })

        return NextResponse.json(genres)
    } catch (error) {
        console.error("Error fetching genres:", error)
        return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 })
    }
}
