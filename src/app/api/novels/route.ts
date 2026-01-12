import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// GET - Get all novels with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Extract query params
        const q = searchParams.get("q")
        const genres = searchParams.get("genres") // comma-separated genre slugs
        const status = searchParams.get("status") // ONGOING, COMPLETED, HIATUS, DROPPED
        const sort = searchParams.get("sort") || "trending" // trending, newest, rating, az
        const language = searchParams.get("language") // "id" or "en"

        // Build where clause
        const where: Prisma.NovelWhereInput = {}

        // Language filter
        if (language && ["id", "en"].includes(language)) {
            where.language = language
        }

        // Search query
        if (q) {
            where.OR = [
                { title: { contains: q, mode: "insensitive" } },
                { author: { contains: q, mode: "insensitive" } },
            ]
        }

        // Genre filter
        if (genres) {
            const genreSlugs = genres.split(",").filter(Boolean)
            if (genreSlugs.length > 0) {
                where.genres = {
                    some: {
                        slug: { in: genreSlugs }
                    }
                }
            }
        }

        // Status filter
        if (status && ["ONGOING", "COMPLETED", "HIATUS", "DROPPED"].includes(status)) {
            where.status = status as "ONGOING" | "COMPLETED" | "HIATUS" | "DROPPED"
        }

        // Build orderBy
        let orderBy: Prisma.NovelOrderByWithRelationInput = { totalViews: "desc" }
        switch (sort) {
            case "newest":
                orderBy = { createdAt: "desc" }
                break
            case "rating":
                orderBy = { avgRating: "desc" }
                break
            case "az":
                orderBy = { title: "asc" }
                break
            case "trending":
            default:
                orderBy = { totalViews: "desc" }
                break
        }

        const novels = await prisma.novel.findMany({
            where,
            orderBy,
            include: {
                genres: true,
                _count: { select: { chapters: true } },
            },
        })

        return NextResponse.json(novels)
    } catch (error) {
        console.error("Error fetching novels:", error)
        return NextResponse.json({ error: "Failed to fetch novels" }, { status: 500 })
    }
}

// POST - Create new novel
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })
        if (user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { title, author, synopsis, status, isPremium, freeChapterLimit, coinCost, genres, cover } = body

        if (!title || !synopsis) {
            return NextResponse.json({ error: "Title and synopsis are required" }, { status: 400 })
        }

        // Generate slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim()

        // Check if slug already exists
        const existingNovel = await prisma.novel.findUnique({ where: { slug } })
        const finalSlug = existingNovel ? `${slug}-${Date.now()}` : slug

        // Create novel
        const novel = await prisma.novel.create({
            data: {
                title,
                slug: finalSlug,
                author: author || null,
                synopsis,
                status: status || "ONGOING",
                isPremium: isPremium || false,
                freeChapterLimit: freeChapterLimit || 0,
                coinCost: coinCost || 5,
                cover: cover || null,
                genres: genres?.length > 0 ? {
                    connect: await Promise.all(
                        genres.map(async (genreName: string) => {
                            const genre = await prisma.genre.findFirst({
                                where: { name: { equals: genreName, mode: "insensitive" } },
                            })
                            if (genre) {
                                return { id: genre.id }
                            }
                            // Create genre if not exists
                            const newGenre = await prisma.genre.create({
                                data: {
                                    name: genreName,
                                    slug: genreName.toLowerCase().replace(/\s+/g, "-"),
                                },
                            })
                            return { id: newGenre.id }
                        })
                    ),
                } : undefined,
            },
            include: { genres: true },
        })

        return NextResponse.json(novel, { status: 201 })
    } catch (error) {
        console.error("Error creating novel:", error)
        return NextResponse.json({ error: "Failed to create novel" }, { status: 500 })
    }
}
