import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function POST() {
    try {
        const translatedDir = path.join(process.cwd(), "scraper-data", "data", "translated", "novels")

        if (!fs.existsSync(translatedDir)) {
            return NextResponse.json({
                success: false,
                error: "scraper-data directory not found"
            }, { status: 404 })
        }

        const rawFiles = fs.readdirSync(translatedDir)
            .filter(f => f.endsWith("_raw.json"))

        let imported = { novels: 0, chapters: 0 }

        for (const file of rawFiles) {
            const filePath = path.join(translatedDir, file)
            const data: any = JSON.parse(fs.readFileSync(filePath, "utf-8"))

            const slug = data.novel
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")

            let novel = await prisma.novel.findUnique({ where: { slug } })

            if (!novel) {
                novel = await prisma.novel.create({
                    data: {
                        title: data.novel,
                        slug,
                        synopsis: "No synopsis available",
                        cover: "",
                        author: "Unknown",
                        status: "COMPLETED",
                        isPremium: false,
                        language: "id",
                        isManual: false,
                    },
                })
                imported.novels++
            }

            // Import chapters (limit to first 100 to prevent timeout)
            const chapters = data.chapters.slice(0, 100)

            for (const chapter of chapters) {
                const existing = await prisma.chapter.findUnique({
                    where: {
                        novelId_chapterNumber: {
                            novelId: novel.id,
                            chapterNumber: chapter.number,
                        },
                    },
                })

                if (existing) continue

                const cleanContent = (chapter.content || "")
                    .replace(/<div[^>]*>/gi, "")
                    .replace(/<\/div>/gi, "")
                    .replace(/<p[^>]*>/gi, "\n\n")
                    .replace(/<\/p>/gi, "")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .trim()

                if (cleanContent.length > 0) {
                    await prisma.chapter.create({
                        data: {
                            novelId: novel.id,
                            chapterNumber: chapter.number,
                            title: chapter.title || `Chapter ${chapter.number}`,
                            contentTranslated: cleanContent,
                            contentOriginal: chapter.contentOriginal || null,
                            wordCount: cleanContent.split(/\s+/).length,
                            isPublished: true,
                            publishedAt: new Date(),
                        },
                    })
                    imported.chapters++
                }
            }
        }

        const totalNovels = await prisma.novel.count()
        const totalChapters = await prisma.chapter.count()

        return NextResponse.json({
            success: true,
            imported,
            total: { novels: totalNovels, chapters: totalChapters }
        })

    } catch (error: any) {
        console.error("Import error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
