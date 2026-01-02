import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
        }

        // Check role from database (in case session is stale)
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })

        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 })
        }

        const jobs = await prisma.scrapeJob.findMany({
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(jobs)
    } catch (error) {
        console.error("Error fetching scrape jobs:", error)
        return NextResponse.json(
            { error: "Failed to fetch jobs" },
            { status: 500 }
        )
    }
}
