import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

// GET /api/novels - Get all novels
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const sort = searchParams.get("sort") || "newest"
        const genre = searchParams.get("genre")
        const status = searchParams.get("status")
        const search = searchParams.get("search")

        const skip = (page - 1) * limit

        // Build where clause
        const where: Record<string, unknown> = {}

        if (genre) {
            where.genres = { some: { slug: genre } }
        }
        if (status) {
            where.status = status
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { author: { contains: search, mode: "insensitive" } },
            ]
        }

        // Build order by
        let orderBy: Record<string, string> = {}
        switch (sort) {
            case "trending":
                orderBy = { totalViews: "desc" }
                break
            case "rating":
                orderBy = { avgRating: "desc" }
                break
            case "oldest":
                orderBy = { createdAt: "asc" }
                break
            default:
                orderBy = { createdAt: "desc" }
        }

        const [novels, total] = await Promise.all([
            prisma.novel.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    genres: true,
                    _count: { select: { chapters: true } },
                },
            }),
            prisma.novel.count({ where }),
        ])

        return NextResponse.json({
            novels,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error("Error fetching novels:", error)
        return NextResponse.json(
            { error: "Failed to fetch novels" },
            { status: 500 }
        )
    }
}

// POST /api/novels - Create new novel
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, synopsis, author, genres, status, isPremium, cover } = body

        if (!title || !synopsis) {
            return NextResponse.json(
                { error: "Title and synopsis are required" },
                { status: 400 }
            )
        }

        const slug = generateSlug(title)

        // Check if slug already exists
        const existing = await prisma.novel.findUnique({ where: { slug } })
        if (existing) {
            return NextResponse.json(
                { error: "Novel with similar title already exists" },
                { status: 400 }
            )
        }

        // Create or connect genres
        if (genres && genres.length > 0) {
            for (const genreName of genres) {
                await prisma.genre.upsert({
                    where: { slug: generateSlug(genreName) },
                    create: { name: genreName, slug: generateSlug(genreName) },
                    update: {},
                })
            }
        }

        const novel = await prisma.novel.create({
            data: {
                title,
                slug,
                synopsis,
                author: author || null,
                cover: cover || null,
                status: status || "ONGOING",
                isPremium: isPremium || false,
                isManual: true,
                genres: genres?.length
                    ? {
                        connect: genres.map((name: string) => ({
                            slug: generateSlug(name),
                        })),
                    }
                    : undefined,
            },
            include: { genres: true },
        })

        return NextResponse.json(novel, { status: 201 })
    } catch (error) {
        console.error("Error creating novel:", error)
        return NextResponse.json(
            { error: "Failed to create novel" },
            { status: 500 }
        )
    }
}
