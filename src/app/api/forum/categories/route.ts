import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - List all forum categories
export async function GET() {
    try {
        // Try to get categories, seed if empty
        let categories = await prisma.forumCategory.findMany({
            orderBy: { order: "asc" },
            include: {
                _count: { select: { posts: true } },
            },
        })

        // Seed default categories if none exist
        if (categories.length === 0) {
            const defaultCategories = [
                { name: "Umum", slug: "umum", description: "Diskusi umum dan obrolan santai", icon: "💬", order: 1 },
                { name: "Diskusi Novel", slug: "diskusi-novel", description: "Bahas novel favorit kamu", icon: "📚", order: 2 },
                { name: "Rekomendasi", slug: "rekomendasi", description: "Minta atau beri rekomendasi novel", icon: "🌟", order: 3 },
                { name: "Request Novel", slug: "request-novel", description: "Request novel untuk diterjemahkan", icon: "📝", order: 4 },
                { name: "Bug Report", slug: "bug-report", description: "Laporkan masalah teknis", icon: "🐛", order: 5 },
                { name: "Pengumuman", slug: "pengumuman", description: "Pengumuman resmi dari tim Novesia", icon: "📢", order: 6 },
            ]

            await prisma.forumCategory.createMany({
                data: defaultCategories,
            })

            categories = await prisma.forumCategory.findMany({
                orderBy: { order: "asc" },
                include: {
                    _count: { select: { posts: true } },
                },
            })
        }

        return NextResponse.json(categories)
    } catch (error) {
        console.error("Error fetching categories:", error)
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }
}
