import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user's novel requests
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const requests = await prisma.novelRequest.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(requests)
    } catch (error) {
        console.error("Error fetching novel requests:", error)
        return NextResponse.json(
            { error: "Failed to fetch requests" },
            { status: 500 }
        )
    }
}

// POST - Create new novel request
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { title, author } = await request.json()

        if (!title || title.trim().length < 2) {
            return NextResponse.json(
                { error: "Judul novel wajib diisi (minimal 2 karakter)" },
                { status: 400 }
            )
        }

        // Check if user already requested this novel
        const existingRequest = await prisma.novelRequest.findFirst({
            where: {
                userId: session.user.id,
                title: {
                    equals: title.trim(),
                    mode: "insensitive",
                },
            },
        })

        if (existingRequest) {
            return NextResponse.json(
                { error: "Kamu sudah pernah request novel ini" },
                { status: 400 }
            )
        }

        const novelRequest = await prisma.novelRequest.create({
            data: {
                title: title.trim(),
                author: author?.trim() || null,
                userId: session.user.id,
            },
        })

        return NextResponse.json(novelRequest, { status: 201 })
    } catch (error) {
        console.error("Error creating novel request:", error)
        return NextResponse.json(
            { error: "Failed to create request" },
            { status: 500 }
        )
    }
}
