import { chromium, Browser, Page } from "playwright"
import { translateLongContent } from "./openai"
import { prisma } from "./prisma"
import { generateSlug, sleep, countWords } from "./utils"

const RATE_LIMIT_MS = parseInt(process.env.SCRAPER_RATE_LIMIT_MS || "2000")
const MAX_CHAPTERS = parseInt(process.env.SCRAPER_MAX_CHAPTERS_PER_RUN || "50")

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
 * Initialize browser instance
 */
async function initBrowser(): Promise<Browser> {
    return await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
}

/**
 * Scrape novel info from AsianNovel
 */
async function scrapeNovelInfo(page: Page, url: string): Promise<NovelInfo | null> {
    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
        await page.waitForSelector(".post-title h1", { timeout: 10000 })

        // Extract title
        const title = await page.$eval(".post-title h1", (el) =>
            el.textContent?.trim() || ""
        )

        // Extract synopsis
        const synopsis = await page.$eval(".summary__content p", (el) =>
            el.textContent?.trim() || ""
        ).catch(() => "")

        // Extract cover
        const cover = await page.$eval(".summary_image img", (el) =>
            el.getAttribute("data-src") || el.getAttribute("src") || ""
        ).catch(() => "")

        // Extract author
        const author = await page.$eval(".author-content a", (el) =>
            el.textContent?.trim() || ""
        ).catch(() => "Unknown")

        // Extract genres
        const genres = await page.$$eval(".genres-content a", (elements) =>
            elements.map((el) => el.textContent?.trim() || "").filter(Boolean)
        ).catch(() => [])

        // Extract chapter list
        const chapters = await page.$$eval(
            ".wp-manga-chapter a",
            (elements) =>
                elements.map((el, index, arr) => ({
                    number: arr.length - index,
                    title: el.textContent?.trim() || `Chapter ${arr.length - index}`,
                    url: el.getAttribute("href") || "",
                }))
        ).catch(() => [])

        return { title, synopsis, cover, author, genres, chapters }
    } catch (error) {
        console.error("Error scraping novel info:", error)
        return null
    }
}

/**
 * Scrape chapter content
 */
async function scrapeChapterContent(page: Page, url: string): Promise<string | null> {
    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
        await page.waitForSelector(".text-left", { timeout: 10000 })

        // Extract content paragraphs
        const content = await page.$$eval(".text-left p", (elements) =>
            elements.map((el) => el.textContent?.trim() || "").join("\n\n")
        )

        return content
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
    let browser: Browser | null = null
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
        browser = await initBrowser()
        const page = await browser.newPage()

        // Scrape novel info
        log("Scraping novel information...")
        const novelInfo = await scrapeNovelInfo(page, novelUrl)

        if (!novelInfo || !novelInfo.title) {
            throw new Error("Failed to scrape novel information")
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
                    synopsis: novelInfo.synopsis,
                    cover: novelInfo.cover,
                    author: novelInfo.author,
                    sourceUrl: novelUrl,
                    isManual: false,
                    genres: {
                        connect: novelInfo.genres.map((name) => ({
                            slug: generateSlug(name),
                        })),
                    },
                },
            })
            log(`Created novel in database: ${novel.id}`)
        } else {
            log(`Novel already exists: ${novel.id}`)
        }

        // Update job with total chapters
        await prisma.scrapeJob.update({
            where: { id: jobId },
            data: {
                novelId: novel.id,
                totalChapters: Math.min(novelInfo.chapters.length, MAX_CHAPTERS),
                status: "TRANSLATING",
            },
        })

        // Get existing chapters
        const existingChapters = await prisma.chapter.findMany({
            where: { novelId: novel.id },
            select: { chapterNumber: true },
        })
        const existingNumbers = new Set(existingChapters.map((c) => c.chapterNumber))

        // Process chapters (newest first, limited by MAX_CHAPTERS)
        const chaptersToProcess = novelInfo.chapters
            .filter((c) => !existingNumbers.has(c.number))
            .slice(0, MAX_CHAPTERS)

        log(`Chapters to process: ${chaptersToProcess.length}`)
        let scrapedCount = 0

        for (const chapterInfo of chaptersToProcess) {
            try {
                log(`Processing Chapter ${chapterInfo.number}: ${chapterInfo.title}`)

                // Scrape content
                const originalContent = await scrapeChapterContent(page, chapterInfo.url)
                if (!originalContent) {
                    log(`Failed to scrape chapter ${chapterInfo.number}, skipping...`)
                    continue
                }

                // Translate content
                log(`Translating Chapter ${chapterInfo.number}...`)
                const translation = await translateLongContent(originalContent, 3000, {
                    novelTitle: novel.title,
                    chapterNumber: chapterInfo.number,
                })

                if (!translation.success || !translation.translatedText) {
                    log(`Translation failed for chapter ${chapterInfo.number}: ${translation.error}`)
                    continue
                }

                // Save to database
                await prisma.chapter.create({
                    data: {
                        novelId: novel.id,
                        chapterNumber: chapterInfo.number,
                        title: chapterInfo.title,
                        contentOriginal: originalContent,
                        contentTranslated: translation.translatedText,
                        wordCount: countWords(translation.translatedText),
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
    } finally {
        if (browser) {
            await browser.close()
        }
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
