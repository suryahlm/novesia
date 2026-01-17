import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST() {
    try {
        // Create admin user
        const hashedPassword = await bcrypt.hash("admin123", 10)

        const admin = await prisma.user.upsert({
            where: { email: "admin@novesia.com" },
            update: {},
            create: {
                email: "admin@novesia.com",
                password: hashedPassword,
                name: "Admin Novesia",
                role: "ADMIN",
                coins: 10000,
                isVip: true,
            }
        })

        // Create basic genres
        const genres = [
            { name: "Action", slug: "action", icon: "⚔️" },
            { name: "Romance", slug: "romance", icon: "💕" },
            { name: "Fantasy", slug: "fantasy", icon: "🧙" },
            { name: "Cultivation", slug: "cultivation", icon: "🏔️" },
            { name: "Sci-Fi", slug: "sci-fi", icon: "🚀" },
        ]

        for (const genre of genres) {
            await prisma.genre.upsert({
                where: { slug: genre.slug },
                update: {},
                create: genre,
            })
        }

        return NextResponse.json({
            success: true,
            message: "Admin user and basic data created!",
            adminEmail: "admin@novesia.com",
            adminPassword: "admin123",
        })
    } catch (error: any) {
        console.error("Setup error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
