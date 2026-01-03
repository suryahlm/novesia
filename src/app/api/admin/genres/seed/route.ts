import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// List of all genres to add
const allGenres = [
    { name: "Action", slug: "action" },
    { name: "Adult", slug: "adult" },
    { name: "Adventure", slug: "adventure" },
    { name: "Comedy", slug: "comedy" },
    { name: "Drama", slug: "drama" },
    { name: "Ecchi", slug: "ecchi" },
    { name: "Fantasy", slug: "fantasy" },
    { name: "Gender Bender", slug: "gender-bender" },
    { name: "Harem", slug: "harem" },
    { name: "Historical", slug: "historical" },
    { name: "Horror", slug: "horror" },
    { name: "Josei", slug: "josei" },
    { name: "Martial Arts", slug: "martial-arts" },
    { name: "Mature", slug: "mature" },
    { name: "Mecha", slug: "mecha" },
    { name: "Mystery", slug: "mystery" },
    { name: "Psychological", slug: "psychological" },
    { name: "Romance", slug: "romance" },
    { name: "School Life", slug: "school-life" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Seinen", slug: "seinen" },
    { name: "Shoujo", slug: "shoujo" },
    { name: "Shoujo Ai", slug: "shoujo-ai" },
    { name: "Shounen", slug: "shounen" },
    { name: "Shounen Ai", slug: "shounen-ai" },
    { name: "Slice of Life", slug: "slice-of-life" },
    { name: "Smut", slug: "smut" },
    { name: "Sports", slug: "sports" },
    { name: "Supernatural", slug: "supernatural" },
    { name: "Tragedy", slug: "tragedy" },
    { name: "Wuxia", slug: "wuxia" },
    { name: "Xianxia", slug: "xianxia" },
    { name: "Xuanhuan", slug: "xuanhuan" },
    { name: "Yaoi", slug: "yaoi" },
    { name: "Yuri", slug: "yuri" },
]

// POST - Seed genres (only add missing ones)
export async function POST() {
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

        // Get existing genres
        const existingGenres = await prisma.genre.findMany({
            select: { slug: true },
        })
        const existingSlugs = new Set(existingGenres.map(g => g.slug))

        // Filter out genres that already exist
        const newGenres = allGenres.filter(g => !existingSlugs.has(g.slug))

        if (newGenres.length === 0) {
            return NextResponse.json({
                message: "No new genres to add",
                added: 0
            })
        }

        // Add new genres
        await prisma.genre.createMany({
            data: newGenres,
            skipDuplicates: true,
        })

        return NextResponse.json({
            message: `Added ${newGenres.length} new genres`,
            added: newGenres.length,
            genres: newGenres.map(g => g.name)
        })
    } catch (error) {
        console.error("Error seeding genres:", error)
        return NextResponse.json({ error: "Failed to seed genres" }, { status: 500 })
    }
}
