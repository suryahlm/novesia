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

// POST - Clean premium text from chapter titles and set isPremium flag
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { novelId, startFromChapter } = await request.json()

        // Find chapters with "[Premium]" in title
        const chaptersToFix = await prisma.chapter.findMany({
            where: {
                ...(novelId && { novelId }),
                title: {
                    contains: "[Premium]"
                }
            },
            select: {
                id: true,
                title: true,
                chapterNumber: true,
            }
        })

        if (chaptersToFix.length === 0) {
            return NextResponse.json({
                message: "Tidak ada chapter dengan [Premium] di title",
                updated: 0
            })
        }

        // Update each chapter: remove [Premium] from title and set isPremium = true
        let updated = 0
        for (const chapter of chaptersToFix) {
            const cleanTitle = chapter.title.replace(/\s*\[Premium\]/gi, "").trim()

            await prisma.chapter.update({
                where: { id: chapter.id },
                data: {
                    title: cleanTitle,
                    isPremium: true,
                    ...(startFromChapter && { coinCost: 10 }) // Set default coin cost
                }
            })
            updated++
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil membersihkan ${updated} chapter`,
            updated,
            sample: chaptersToFix.slice(0, 5).map(ch => ({
                chapterNumber: ch.chapterNumber,
                oldTitle: ch.title,
                newTitle: ch.title.replace(/\s*\[Premium\]/gi, "").trim()
            }))
        })
    } catch (error) {
        console.error("Error cleaning chapters:", error)
        return NextResponse.json({
            error: `Gagal clean chapters: ${error instanceof Error ? error.message : "Unknown error"}`
        }, { status: 500 })
    }
}

// GET - Preview chapters with [Premium] in title
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const chaptersWithPremium = await prisma.chapter.findMany({
            where: {
                title: {
                    contains: "[Premium]"
                }
            },
            select: {
                id: true,
                title: true,
                chapterNumber: true,
                isPremium: true,
                novel: {
                    select: { title: true, slug: true }
                }
            },
            take: 20
        })

        const totalCount = await prisma.chapter.count({
            where: {
                title: {
                    contains: "[Premium]"
                }
            }
        })

        return NextResponse.json({
            total: totalCount,
            sample: chaptersWithPremium
        })
    } catch (error) {
        console.error("Error fetching chapters:", error)
        return NextResponse.json({ error: "Gagal fetch chapters" }, { status: 500 })
    }
}
