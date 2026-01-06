import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get ratings for a novel
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const novelId = searchParams.get("novelId")

        if (!novelId) {
            return NextResponse.json({ error: "novelId is required" }, { status: 400 })
        }

        // Get ratings with user info
        const ratings = await prisma.rating.findMany({
            where: { novelId },
            include: {
                user: {
                    select: { id: true, name: true, image: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        })

        // Get stats
        const stats = await prisma.rating.aggregate({
            where: { novelId },
            _avg: { score: true },
            _count: { score: true },
        })

        // Get score distribution
        const distribution = await prisma.rating.groupBy({
            by: ["score"],
            where: { novelId },
            _count: { score: true },
        })

        // Check if current user has rated
        const session = await auth()
        let userRating = null
        if (session?.user?.id) {
            userRating = await prisma.rating.findUnique({
                where: {
                    userId_novelId: {
                        userId: session.user.id,
                        novelId,
                    },
                },
            })
        }

        return NextResponse.json({
            ratings,
            stats: {
                avgRating: stats._avg.score || 0,
                totalRatings: stats._count.score,
                distribution: distribution.reduce((acc, d) => {
                    acc[d.score] = d._count.score
                    return acc
                }, {} as Record<number, number>),
            },
            userRating,
        })
    } catch (error) {
        console.error("Error fetching ratings:", error)
        return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 })
    }
}

// POST - Create or update a rating
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { novelId, score, review } = body

        if (!novelId || !score || score < 1 || score > 5) {
            return NextResponse.json(
                { error: "novelId and score (1-5) are required" },
                { status: 400 }
            )
        }

        // Upsert rating
        const rating = await prisma.rating.upsert({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId,
                },
            },
            update: {
                score,
                review: review || null,
            },
            create: {
                userId: session.user.id,
                novelId,
                score,
                review: review || null,
            },
        })

        // Update novel's average rating and count
        const stats = await prisma.rating.aggregate({
            where: { novelId },
            _avg: { score: true },
            _count: { score: true },
        })

        await prisma.novel.update({
            where: { id: novelId },
            data: {
                avgRating: stats._avg.score || 0,
                ratingCount: stats._count.score,
            },
        })

        return NextResponse.json({
            success: true,
            rating,
            message: "Rating berhasil disimpan!",
        })
    } catch (error) {
        console.error("Error creating rating:", error)
        return NextResponse.json({ error: "Failed to create rating" }, { status: 500 })
    }
}

// DELETE - Delete a rating
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const novelId = searchParams.get("novelId")

        if (!novelId) {
            return NextResponse.json({ error: "novelId is required" }, { status: 400 })
        }

        // Delete rating
        await prisma.rating.delete({
            where: {
                userId_novelId: {
                    userId: session.user.id,
                    novelId,
                },
            },
        })

        // Update novel's average rating and count
        const stats = await prisma.rating.aggregate({
            where: { novelId },
            _avg: { score: true },
            _count: { score: true },
        })

        await prisma.novel.update({
            where: { id: novelId },
            data: {
                avgRating: stats._avg.score || 0,
                ratingCount: stats._count.score,
            },
        })

        return NextResponse.json({
            success: true,
            message: "Rating berhasil dihapus!",
        })
    } catch (error) {
        console.error("Error deleting rating:", error)
        return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 })
    }
}
