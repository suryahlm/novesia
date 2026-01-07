import { NextRequest, NextResponse } from "next/server"
import { r2Client } from "@/lib/r2"
import { GetObjectCommand } from "@aws-sdk/client-s3"

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "novesia-assets"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params
        const key = path.join("/")

        if (!key) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        })

        const response = await r2Client.send(command)

        if (!response.Body) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = []
        const reader = response.Body.transformToWebStream().getReader()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
        }

        const buffer = Buffer.concat(chunks)

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": response.ContentType || "application/octet-stream",
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
            },
        })
    } catch (error) {
        console.error("CDN proxy error:", error)
        return new NextResponse("Not Found", { status: 404 })
    }
}
