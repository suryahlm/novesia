import { NextRequest, NextResponse } from "next/server"

// Image proxy to bypass CORS and SSL issues with R2 dev URLs
export async function GET(request: NextRequest) {
    try {
        const url = request.nextUrl.searchParams.get("url")

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 })
        }

        // Only allow R2 URLs for security
        const allowedDomains = [
            "pub-d7fdf7a6932b4febbd724bd48ae0c2c3.r2.dev",
            "r2.dev",
            "r2.cloudflarestorage.com",
        ]

        const parsedUrl = new URL(url)
        const isAllowed = allowedDomains.some(domain =>
            parsedUrl.hostname.includes(domain)
        )

        if (!isAllowed) {
            return NextResponse.json({ error: "Domain not allowed" }, { status: 403 })
        }

        // Fetch image with Node.js (bypasses browser SSL issues)
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Novesia-ImageProxy/1.0",
            },
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch image" },
                { status: response.status }
            )
        }

        const contentType = response.headers.get("content-type") || "image/jpeg"
        const buffer = await response.arrayBuffer()

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        })
    } catch (error) {
        console.error("Image proxy error:", error)
        return NextResponse.json({ error: "Proxy error" }, { status: 500 })
    }
}
