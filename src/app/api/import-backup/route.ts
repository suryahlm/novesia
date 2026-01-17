import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

interface NovelFile {
    id: string
    title: string
    synopsis: string
    author: string
    cover: string
    genres: string[]
    status: string
    totalChapters: number
    chapters: Array<{
        title: string
        content: string
        contentOriginal?: string
    }>
}

export async function POST() {
    try {
        console.log("📚 Starting FULL novel import from scraper-data...")

        let importedNovels = 0
        let importedChapters = 0

        // Import from scraper-data/data/translated/novels
        const translatedDir = path.join(process.cwd(), "scraper-data", "data", "translated", "novels")

        if (fs.existsSync(translatedDir)) {
            const novelFiles = fs.readdirSync(translatedDir)
                .filter(f => f.endsWith(".json") && !f.includes("_raw"))

            console.log(`Found ${novelFiles.length} novel files to import`)

            for (const file of novelFiles) {
                const filePath = path.join(translatedDir, file)
                const novelData: NovelFile = JSON.parse(fs.readFileSync(filePath, "utf-8"))

                // Generate slug from title
                const slug = novelData.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")

                // Determine status
                const status = novelData.status === "completed" ? "COMPLETED" : "ONGOING"

                // Create/update novel
                const novel = await prisma.novel.upsert({
                    where: { slug },
                    update: {},
                    create: {
                        title: novelData.title,
                        slug,
                        synopsis: novelData.synopsis || "No synopsis available",
                        cover: novelData.cover || "",
                        author: novelData.author || "Unknown",
                        status,
                        isPremium: false,
                        language: "id",
                        isManual: false,
                    },
                })

                importedNovels++
                console.log(`✓ Imported novel: ${novelData.title}`)

                // Handle genres
                if (novelData.genres && Array.isArray(novelData.genres)) {
                    for (const genreName of novelData.genres) {
                        const genreSlug = genreName.toLowerCase().replace(/\s+/g, "-")

                        const genre = await prisma.genre.upsert({
                            where: { slug: genreSlug },
                            update: {},
                            create: {
                                name: genreName,
                                slug: genreSlug,
                                icon: "📚",
                            },
                        })

                        // Connect genre to novel
                        await prisma.$executeRaw`
                            INSERT INTO "_GenreToNovel" ("A", "B")
                            VALUES (${genre.id}, ${novel.id})
                            ON CONFLICT DO NOTHING
                        `
                    }
                }

                // Import chapters
                if (novelData.chapters && Array.isArray(novelData.chapters)) {
                    let batchCount = 0
                    for (let i = 0; i < novelData.chapters.length; i++) {
                        const chapter = novelData.chapters[i]
                        const chapterNumber = i + 1

                        // Clean content
                        let cleanContent = (chapter.content || "")
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
                            await prisma.chapter.upsert({
                                where: {
                                    novelId_chapterNumber: {
                                        novelId: novel.id,
                                        chapterNumber,
                                    },
                                },
                                update: {},
                                create: {
                                    novelId: novel.id,
                                    chapterNumber,
                                    title: chapter.title || `Chapter ${chapterNumber}`,
                                    contentTranslated: cleanContent,
                                    contentOriginal: chapter.contentOriginal || null,
                                    wordCount: cleanContent.split(/\s+/).length,
                                    isPublished: true,
                                    publishedAt: new Date(),
                                },
                            })

                            batchCount++
                            importedChapters++
                        }
                    }

                    console.log(`  ✓ Imported ${batchCount} chapters`)
                }
            }
        }

        // Get final stats
        const novelCount = await prisma.novel.count()
        const chapterCount = await prisma.chapter.count()
        const publishedChapterCount = await prisma.chapter.count({ where: { isPublished: true } })

        return NextResponse.json({
            success: true,
            message: "Full import completed successfully!",
            stats: {
                importedNovels,
                importedChapters,
                totalNovels: novelCount,
                totalChapters: chapterCount,
                publishedChapters: publishedChapterCount,
            },
        })

    } catch (error: any) {
        console.error("Import error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
