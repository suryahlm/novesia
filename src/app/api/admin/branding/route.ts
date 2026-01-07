import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToR2, getR2PublicUrl } from "@/lib/r2"

// Helper to verify admin
async function verifyAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    return user?.role === "ADMIN"
}

// Fixed paths for branding assets (without extension)
const BRANDING_PATHS = {
    logo: "branding/logo",
    favicon: "branding/favicon",
    ogImage: "branding/og-image",
}

// Settings keys for storing actual URLs
const BRANDING_SETTINGS = {
    logo: "brandingLogoUrl",
    favicon: "brandingFaviconUrl",
    ogImage: "brandingOgImageUrl",
}

// GET - Get current branding URLs from settings
export async function GET() {
    try {
        // Get URLs from settings table
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: Object.values(BRANDING_SETTINGS)
                }
            }
        })

        const urlMap: Record<string, string> = {}
        settings.forEach(s => {
            urlMap[s.key] = JSON.parse(s.value)
        })

        return NextResponse.json({
            logoUrl: urlMap[BRANDING_SETTINGS.logo] || "",
            faviconUrl: urlMap[BRANDING_SETTINGS.favicon] || "",
            ogImageUrl: urlMap[BRANDING_SETTINGS.ogImage] || "",
        })
    } catch (error) {
        console.error("Error fetching branding:", error)
        return NextResponse.json({
            logoUrl: "",
            faviconUrl: "",
            ogImageUrl: "",
        })
    }
}

// POST - Upload a branding asset
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const isAdmin = await verifyAdmin(session.user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File
        const type = formData.get("type") as string // "logo" | "favicon" | "ogImage"

        if (!file || !type) {
            return NextResponse.json({ error: "File and type required" }, { status: 400 })
        }

        // Validate type
        if (!["logo", "favicon", "ogImage"].includes(type)) {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 })
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 })
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Determine file extension and validate
        const ext = file.name.split(".").pop()?.toLowerCase() || "png"

        // Validate extensions based on type
        if (type === "favicon") {
            if (!["ico", "png", "webp"].includes(ext)) {
                return NextResponse.json({ error: "Favicon must be .ico, .png or .webp" }, { status: 400 })
            }
        } else {
            if (!["png", "jpg", "jpeg", "svg", "webp"].includes(ext)) {
                return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
            }
        }

        // Upload to R2 with actual extension
        const basePath = BRANDING_PATHS[type as keyof typeof BRANDING_PATHS]
        const filename = `${basePath}.${ext}`

        await uploadToR2(buffer, filename, file.type)
        const url = getR2PublicUrl(filename)

        // Save actual URL to settings
        const settingKey = BRANDING_SETTINGS[type as keyof typeof BRANDING_SETTINGS]
        await prisma.setting.upsert({
            where: { key: settingKey },
            update: { value: JSON.stringify(url) },
            create: { key: settingKey, value: JSON.stringify(url) },
        })

        return NextResponse.json({
            success: true,
            type,
            url,
            message: `${type} uploaded successfully`
        })
    } catch (error) {
        console.error("Error uploading branding:", error)
        return NextResponse.json({
            error: `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`
        }, { status: 500 })
    }
}
