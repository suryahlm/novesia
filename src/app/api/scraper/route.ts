import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createScrapeJob, runScrapePipeline } from "@/lib/scraper"

// GET /api/scraper - Get scrape jobs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")

        const where = status ? { status: status as never } : {}

        const jobs = await prisma.scrapeJob.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
        })

        return NextResponse.json(jobs)
    } catch (error) {
        console.error("Error fetching scrape jobs:", error)
        return NextResponse.json(
            { error: "Failed to fetch scrape jobs" },
            { status: 500 }
        )
    }
}

// POST /api/scraper - Create new scrape job
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { novelUrl } = body

        if (!novelUrl) {
            return NextResponse.json(
                { error: "Novel URL is required" },
                { status: 400 }
            )
        }

        // Validate URL format
        try {
            const url = new URL(novelUrl)
            if (!url.hostname.includes("asianovel")) {
                return NextResponse.json(
                    { error: "Only AsianNovel URLs are supported" },
                    { status: 400 }
                )
            }
        } catch {
            return NextResponse.json(
                { error: "Invalid URL format" },
                { status: 400 }
            )
        }

        // Create job
        const jobId = await createScrapeJob(novelUrl)

        // Start scraping in background (don't await)
        // In production, use a proper job queue like BullMQ
        runScrapePipeline(jobId, novelUrl).catch((error) => {
            console.error("Scrape pipeline error:", error)
        })

        return NextResponse.json(
            { jobId, message: "Scrape job started" },
            { status: 201 }
        )
    } catch (error) {
        console.error("Error creating scrape job:", error)
        return NextResponse.json(
            { error: "Failed to create scrape job" },
            { status: 500 }
        )
    }
}
