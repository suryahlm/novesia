import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const [users, total, vipCount, adminCount] = await Promise.all([
            prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    isVip: true,
                    coins: true,
                    createdAt: true,
                    _count: {
                        select: {
                            readingHistory: true,
                            bookmarks: true,
                        },
                    },
                },
            }),
            prisma.user.count(),
            prisma.user.count({ where: { isVip: true } }),
            prisma.user.count({ where: { role: "ADMIN" } }),
        ])

        return NextResponse.json({
            users,
            stats: { total, vipCount, adminCount },
        })
    } catch (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        )
    }
}
