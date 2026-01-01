import { NextRequest, NextResponse } from "next/server"
import { uploadToR2, generateCoverKey } from "@/lib/r2"

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const type = formData.get("type") as string || "cover" // cover, chapter, avatar
        const slug = formData.get("slug") as string || ""

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size: 5MB" },
                { status: 400 }
            )
        }

        // Get file extension
        const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1]

        // Generate key based on type
        let key: string
        if (type === "cover" && slug) {
            key = generateCoverKey(slug, extension)
        } else {
            // Generic upload with timestamp
            const timestamp = Date.now()
            key = `uploads/${type}/${timestamp}.${extension}`
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Upload to R2
        const publicUrl = await uploadToR2(buffer, key, file.type)

        return NextResponse.json({
            success: true,
            url: publicUrl,
            key,
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        )
    }
}
