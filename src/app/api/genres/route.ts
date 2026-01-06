import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get all genres with novel count
export async function GET() {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: { select: { novels: true } },
            },
        })
        return NextResponse.json(genres)
    } catch (error) {
        console.error("Error fetching genres:", error)
        return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 })
    }
}
