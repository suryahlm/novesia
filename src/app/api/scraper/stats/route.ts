import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })

        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get scraping and translation stats
        const [
            totalNovels,
            totalChapters,
            translatedChapters,
            untranslatedChapters,
            recentNovels,
            recentChapters
        ] = await Promise.all([
            prisma.novel.count(),
            prisma.chapter.count(),
            prisma.chapter.count({
                where: {
                    contentTranslated: { not: "" }
                }
            }),
            prisma.chapter.count({
                where: {
                    OR: [
                        { contentTranslated: null },
                        { contentTranslated: "" }
                    ]
                }
            }),
            prisma.novel.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                }
            }),
            prisma.chapter.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                }
            })
        ])

        const translationProgress = totalChapters > 0
            ? Math.round((translatedChapters / totalChapters) * 100)
            : 0

        return NextResponse.json({
            novels: {
                total: totalNovels,
                recentlyAdded: recentNovels
            },
            chapters: {
                total: totalChapters,
                translated: translatedChapters,
                untranslated: untranslatedChapters,
                recentlyAdded: recentChapters,
                translationProgress
            }
        })
    } catch (error) {
        console.error("Error fetching VPS stats:", error)
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        )
    }
}
