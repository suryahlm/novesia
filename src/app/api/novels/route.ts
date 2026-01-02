import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get all novels
export async function GET() {
    try {
        const novels = await prisma.novel.findMany({
            orderBy: { createdAt: "desc" },
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
