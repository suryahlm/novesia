import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get single novel
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const novel = await prisma.novel.findUnique({
            where: { id },
            include: {
                genres: true,
                _count: { select: { chapters: true } },
            },
        })

        if (!novel) {
            return NextResponse.json({ error: "Novel not found" }, { status: 404 })
        }

        return NextResponse.json(novel)
    } catch (error) {
        console.error("Error fetching novel:", error)
        return NextResponse.json({ error: "Failed to fetch novel" }, { status: 500 })
    }
}

// PUT - Update novel
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        const body = await request.json()
        const { title, author, synopsis, status, isPremium, freeChapterLimit, coinCost, cover, genres } = body

        const novel = await prisma.novel.update({
            where: { id },
            data: {
                title,
                author,
                synopsis,
                status,
                isPremium,
                freeChapterLimit,
                coinCost,
                cover,
                genres: genres ? {
                    set: [],
                    connect: await Promise.all(
                        genres.map(async (genreName: string) => {
                            const genre = await prisma.genre.findFirst({
                                where: { name: { equals: genreName, mode: "insensitive" } },
                            })
                            if (genre) return { id: genre.id }
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

        return NextResponse.json(novel)
    } catch (error) {
        console.error("Error updating novel:", error)
        return NextResponse.json({ error: "Failed to update novel" }, { status: 500 })
    }
}

// DELETE - Delete novel
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        console.log("Deleting novel:", id)

        // First disconnect genres (many-to-many - not auto-deleted)
        await prisma.novel.update({
            where: { id },
            data: { genres: { set: [] } },
        })

        // Delete ratings for this novel (if exists)
        await prisma.rating.deleteMany({
            where: { novelId: id },
        }).catch(() => { })

        // Now delete the novel - chapters and other relations cascade automatically
        await prisma.novel.delete({
            where: { id },
        })

        console.log("Novel deleted successfully:", id)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting novel:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json({ error: `Failed to delete novel: ${errorMessage}` }, { status: 500 })
    }
}
