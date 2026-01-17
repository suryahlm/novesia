import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

interface NovelBackup {
    title: string
    storyId: string
    novelUrl: string
    coverUrl: string
    author: string
    synopsis: string
    genres: string[]
    chaptersCount: number
    isCompleted: boolean
    isPremium: boolean
}

interface ChapterBackup {
    number: number
    title: string
    content: string
}

async function importNovels() {
    console.log("📚 Starting novel import...")

    // Read selected-novels.json
    const novelsPath = path.join(process.cwd(), "selected-novels.json")
    const novelsData: NovelBackup[] = JSON.parse(fs.readFileSync(novelsPath, "utf-8"))

    console.log(`Found ${novelsData.length} novels to import`)

    for (const novel of novelsData) {
        try {
            // Create slug from title
            const slug = novel.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")

            // Determine status
            const status = novel.isCompleted ? "COMPLETED" : "ONGOING"

            // Create or update novel
            const createdNovel = await prisma.novel.upsert({
                where: { slug },
                update: {},
                create: {
                    title: novel.title,
                    slug,
                    synopsis: novel.synopsis,
                    cover: novel.coverUrl,
                    author: novel.author,
                    status,
                    sourceUrl: novel.novelUrl,
                    isPremium: novel.isPremium,
                    language: "id", // Assuming these are Indonesian translations
                    isManual: false,
                },
            })

            console.log(`✅ Imported: ${novel.title}`)

            // Connect genres (you'll need to create genres first if they don't exist)
            for (const genreName of novel.genres) {
                const genreSlug = genreName.toLowerCase().replace(/\s+/g, "-")

                // Try to find or create genre
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
                    VALUES (${genre.id}, ${createdNovel.id})
                    ON CONFLICT DO NOTHING
                `
            }

        } catch (error) {
            console.error(`❌ Error importing ${novel.title}:`, error)
        }
    }

    console.log("✅ Novel import completed!")
}

async function importChapters() {
    console.log("\n📖 Starting chapter import...")

    const exportsDir = path.join(process.cwd(), "exports", "rebirth-of-a-majestic-empress")

    // Find the novel
    const novel = await prisma.novel.findFirst({
        where: {
            title: {
                contains: "Rebirth of a Majestic Empress",
            },
        },
    })

    if (!novel) {
        console.error("❌ Novel 'Rebirth of a Majestic Empress' not found!")
        return
    }

    console.log(`Found novel: ${novel.title}`)

    // Read all batch files
    const files = fs.readdirSync(exportsDir).filter(f => f.startsWith("batch-") && f.endsWith(".json"))
    files.sort() // Sort to maintain order

    console.log(`Found ${files.length} batch files`)

    for (const file of files) {
        const filePath = path.join(exportsDir, file)
        const chapters: ChapterBackup[] = JSON.parse(fs.readFileSync(filePath, "utf-8"))

        console.log(`Processing ${file} with ${chapters.length} chapters...`)

        for (const chapter of chapters) {
            try {
                // Strip HTML tags from content for cleaner storage
                const cleanContent = chapter.content
                    .replace(/<div[^>]*>/g, "")
                    .replace(/<\/div>/g, "")
                    .replace(/<p[^>]*>/g, "\n\n")
                    .replace(/<\/p>/g, "")
                    .replace(/&nbsp;/g, " ")
                    .trim()

                await prisma.chapter.upsert({
                    where: {
                        novelId_chapterNumber: {
                            novelId: novel.id,
                            chapterNumber: chapter.number,
                        },
                    },
                    update: {},
                    create: {
                        novelId: novel.id,
                        chapterNumber: chapter.number,
                        title: chapter.title,
                        contentTranslated: cleanContent,
                        wordCount: cleanContent.split(/\s+/).length,
                        isPublished: true, // Mark as published since these are complete translations
                        publishedAt: new Date(),
                    },
                })

                console.log(`  ✅ Chapter ${chapter.number}: ${chapter.title}`)
            } catch (error) {
                console.error(`  ❌ Error importing chapter ${chapter.number}:`, error)
            }
        }
    }

    console.log("✅ Chapter import completed!")
}

async function main() {
    try {
        console.log("🚀 Starting backup data import...\n")

        await importNovels()
        await importChapters()

        console.log("\n🎉 Import completed successfully!")

        // Show stats
        const novelCount = await prisma.novel.count()
        const chapterCount = await prisma.chapter.count()
        const publishedChapterCount = await prisma.chapter.count({ where: { isPublished: true } })

        console.log("\n📊 Database Stats:")
        console.log(`  - Total Novels: ${novelCount}`)
        console.log(`  - Total Chapters: ${chapterCount}`)
        console.log(`  - Published Chapters: ${publishedChapterCount}`)

    } catch (error) {
        console.error("❌ Import failed:", error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
