import * as cheerio from "cheerio"
import { translateLongContent } from "./openai"
import { prisma } from "./prisma"
import { generateSlug, sleep, countWords } from "./utils"

const RATE_LIMIT_MS = parseInt(process.env.SCRAPER_RATE_LIMIT_MS || "2000")
const MAX_CHAPTERS = parseInt(process.env.SCRAPER_MAX_CHAPTERS_PER_RUN || "10")

interface NovelInfo {
    title: string
    synopsis: string
    cover?: string
    author?: string
    genres: string[]
    chapters: ChapterInfo[]
}

interface ChapterInfo {
    number: number
    title: string
    url: string
}

interface ScrapeResult {
    success: boolean
    novelId?: string
    error?: string
    chaptersScraped?: number
}

/**
 * Fetch HTML content from URL
 */
async function fetchHTML(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
        })
        if (!response.ok) {
            console.error(`HTTP error: ${response.status}`)
            return null
        }
        return await response.text()
    } catch (error) {
        console.error("Fetch error:", error)
        return null
    }
}

/**
 * Scrape novel info from AsianNovel
 */
async function scrapeNovelInfo(url: string): Promise<NovelInfo | null> {
    try {
        const html = await fetchHTML(url)
        if (!html) return null

        const $ = cheerio.load(html)

        // Extract title
        const title = $(".post-title h1").text().trim() ||
            $("h1.entry-title").text().trim() ||
            $("h1").first().text().trim()

        if (!title) {
            console.error("Could not find title")
            return null
        }

        // Extract synopsis
        const synopsis = $(".summary__content p").first().text().trim() ||
            $(".description-summary").text().trim() ||
            $(".summary").text().trim() ||
            ""

        // Extract cover
        const cover = $(".summary_image img").attr("data-src") ||
            $(".summary_image img").attr("src") ||
            $("img.wp-post-image").attr("src") ||
            ""

        // Extract author
        const author = $(".author-content a").text().trim() ||
            $(".author a").text().trim() ||
            "Unknown"

        // Extract genres
        const genres: string[] = []
        $(".genres-content a, .wp-manga-genre a").each((_, el) => {
            const genre = $(el).text().trim()
            if (genre) genres.push(genre)
        })

        // Extract chapter list
        const chapters: ChapterInfo[] = []
        $(".wp-manga-chapter a, .chapter-item a").each((index, el) => {
            const chapterUrl = $(el).attr("href") || ""
            const chapterTitle = $(el).text().trim()
            if (chapterUrl) {
                chapters.push({
                    number: index + 1, // Will be reversed later
                    title: chapterTitle || `Chapter ${index + 1}`,
                    url: chapterUrl,
                })
            }
        })

        // Reverse to get correct order (newest first in HTML, we want oldest first)
        chapters.reverse()
        chapters.forEach((ch, i) => { ch.number = i + 1 })

        return { title, synopsis, cover, author, genres, chapters }
    } catch (error) {
        console.error("Error scraping novel info:", error)
        return null
    }
}

/**
 * Scrape chapter content
 */
async function scrapeChapterContent(url: string): Promise<string | null> {
    try {
        const html = await fetchHTML(url)
        if (!html) return null

        const $ = cheerio.load(html)

        // Extract content paragraphs
        const paragraphs: string[] = []
        $(".text-left p, .reading-content p, .entry-content p").each((_, el) => {
            const text = $(el).text().trim()
            if (text) paragraphs.push(text)
        })

        if (paragraphs.length === 0) {
            // Try alternative selectors
            $(".chapter-content p, #chapter-content p, .content p").each((_, el) => {
                const text = $(el).text().trim()
                if (text) paragraphs.push(text)
            })
        }

        return paragraphs.join("\n\n")
    } catch (error) {
        console.error("Error scraping chapter content:", error)
        return null
    }
}

/**
 * Main scraping pipeline
 */
export async function runScrapePipeline(
    jobId: string,
    novelUrl: string
): Promise<ScrapeResult> {
    const logs: string[] = []

    const log = (message: string) => {
        const timestamp = new Date().toISOString()
        logs.push(`[${timestamp}] ${message}`)
        console.log(message)
    }

    try {
        // Update job status
        await prisma.scrapeJob.update({
            where: { id: jobId },
            data: { status: "SCRAPING", startedAt: new Date() },
        })

        log(`Starting scrape for: ${novelUrl}`)

        // Scrape novel info
        log("Scraping novel information...")
        const novelInfo = await scrapeNovelInfo(novelUrl)

        if (!novelInfo || !novelInfo.title) {
            throw new Error("Failed to scrape novel information. Site may be blocking requests or URL is invalid.")
        }

        log(`Found novel: ${novelInfo.title}`)
        log(`Total chapters available: ${novelInfo.chapters.length}`)

        // Create or update novel in database
        const slug = generateSlug(novelInfo.title)
        let novel = await prisma.novel.findUnique({ where: { slug } })

        if (!novel) {
            // Create genres first
            for (const genreName of novelInfo.genres) {
                await prisma.genre.upsert({
                    where: { slug: generateSlug(genreName) },
                    create: { name: genreName, slug: generateSlug(genreName) },
                    update: {},
                })
            }

            novel = await prisma.novel.create({
                data: {
                    title: novelInfo.title,
                    slug,
                    synopsis: novelInfo.synopsis || "No synopsis available",
                    cover: novelInfo.cover,
                    author: novelInfo.author,
                    sourceUrl: novelUrl,
                    isManual: false,
                    genres: novelInfo.genres.length > 0 ? {
                        connect: novelInfo.genres.map((name) => ({
                            slug: generateSlug(name),
                        })),
                    } : undefined,
                },
            })
            log(`Created novel in database: ${novel.id}`)
        } else {
            log(`Novel already exists: ${novel.id}`)
        }

        // Update job with total chapters
        const chaptersToScrape = Math.min(novelInfo.chapters.length, MAX_CHAPTERS)
        await prisma.scrapeJob.update({
            where: { id: jobId },
            data: {
                novelId: novel.id,
                totalChapters: chaptersToScrape,
                status: "TRANSLATING",
            },
        })

        // Get existing chapters
        const existingChapters = await prisma.chapter.findMany({
            where: { novelId: novel.id },
            select: { chapterNumber: true },
        })
        const existingNumbers = new Set(existingChapters.map((c) => c.chapterNumber))

        // Process chapters (limited by MAX_CHAPTERS)
        const chaptersToProcess = novelInfo.chapters
            .filter((c) => !existingNumbers.has(c.number))
            .slice(0, MAX_CHAPTERS)

        log(`Chapters to process: ${chaptersToProcess.length}`)
        let scrapedCount = 0

        for (const chapterInfo of chaptersToProcess) {
            try {
                log(`Processing Chapter ${chapterInfo.number}: ${chapterInfo.title}`)

                // Scrape content
                const originalContent = await scrapeChapterContent(chapterInfo.url)
                if (!originalContent || originalContent.length < 100) {
                    log(`Failed to scrape chapter ${chapterInfo.number}, skipping...`)
                    continue
                }

                // Translate content (if OpenAI is configured)
                let translatedContent = originalContent
                try {
                    log(`Translating Chapter ${chapterInfo.number}...`)
                    const translation = await translateLongContent(originalContent, 3000, {
                        novelTitle: novel.title,
                        chapterNumber: chapterInfo.number,
                    })

                    if (translation.success && translation.translatedText) {
                        translatedContent = translation.translatedText
                    } else {
                        log(`Translation failed, using original: ${translation.error}`)
                    }
                } catch (translateError) {
                    log(`Translation error, using original content`)
                }

                // Save to database
                await prisma.chapter.create({
                    data: {
                        novelId: novel.id,
                        chapterNumber: chapterInfo.number,
                        title: chapterInfo.title,
                        contentOriginal: originalContent,
                        contentTranslated: translatedContent,
                        wordCount: countWords(translatedContent),
                        sourceUrl: chapterInfo.url,
                    },
                })

                scrapedCount++
                log(`Saved Chapter ${chapterInfo.number}`)

                // Update progress
                await prisma.scrapeJob.update({
                    where: { id: jobId },
                    data: { scrapedChapters: scrapedCount },
                })

                // Rate limiting
                await sleep(RATE_LIMIT_MS)
            } catch (error) {
                log(`Error processing chapter ${chapterInfo.number}: ${error}`)
            }
        }

        // Mark job as completed
        await prisma.scrapeJob.update({
            where: { id: jobId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                logs: logs.join("\n"),
            },
        })

        log(`Scraping completed! Processed ${scrapedCount} chapters.`)

        return {
            success: true,
            novelId: novel.id,
            chaptersScraped: scrapedCount,
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        log(`Scraping failed: ${errorMessage}`)

        await prisma.scrapeJob.update({
            where: { id: jobId },
            data: {
                status: "FAILED",
                error: errorMessage,
                logs: logs.join("\n"),
                completedAt: new Date(),
            },
        })

        return { success: false, error: errorMessage }
    }
}

/**
 * Create a new scrape job
 */
export async function createScrapeJob(novelUrl: string): Promise<string> {
    const job = await prisma.scrapeJob.create({
        data: { novelUrl },
    })
    return job.id
}

export default { runScrapePipeline, createScrapeJob }
