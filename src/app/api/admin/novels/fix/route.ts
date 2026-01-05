import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper to verify admin
async function verifyAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    return user?.role === "ADMIN"
}

// PATCH - Update novel metadata
export async function PATCH(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { novelId, slugPattern, title, cover, slug, author, synopsis } = await request.json()

        // Find novel by ID or slug pattern
        let novel = null

        if (novelId) {
            novel = await prisma.novel.findUnique({ where: { id: novelId } })
        } else if (slugPattern) {
            novel = await prisma.novel.findFirst({
                where: {
                    OR: [
                        { slug: slugPattern },
                        { slug: { contains: slugPattern } }
                    ]
                }
            })
        }

        if (!novel) {
            const allNovels = await prisma.novel.findMany({
                select: { id: true, slug: true, title: true }
            })
            return NextResponse.json({
                error: "Novel tidak ditemukan",
                allNovels
            }, { status: 404 })
        }

        // Update novel
        const updateData: Record<string, string> = {}
        if (title) updateData.title = title
        if (cover) updateData.cover = cover
        if (slug) updateData.slug = slug
        if (author) updateData.author = author
        if (synopsis) updateData.synopsis = synopsis

        const updated = await prisma.novel.update({
            where: { id: novel.id },
            data: updateData,
        })

        return NextResponse.json({
            success: true,
            novel: {
                id: updated.id,
                title: updated.title,
                slug: updated.slug,
                cover: updated.cover,
                author: updated.author,
            }
        })
    } catch (error) {
        console.error("Error updating novel:", error)
        return NextResponse.json({
            error: `Gagal update novel: ${error instanceof Error ? error.message : "Unknown error"}`
        }, { status: 500 })
    }
}
