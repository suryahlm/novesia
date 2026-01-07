import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToR2, getR2PublicUrl, getCdnUrl, r2Client } from "@/lib/r2"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"

// Helper to verify admin
async function verifyAdmin(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    return user?.role === "ADMIN"
}

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "novesia-assets"

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

// Helper: Find actual file in R2 by scanning for any extension
async function findBrandingFileInR2(basePath: string): Promise<string | null> {
    try {
        const command = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: basePath,
            MaxKeys: 10,
        })
        const response = await r2Client.send(command)

        if (response.Contents && response.Contents.length > 0) {
            // Find first matching file
            const file = response.Contents.find(obj =>
                obj.Key && obj.Key.startsWith(basePath + ".")
            )
            if (file?.Key) {
                return getCdnUrl(file.Key)
            }
        }
    } catch (error) {
        console.error(`Error scanning R2 for ${basePath}:`, error)
    }
    return null
}

// GET - Get current branding URLs (with R2 fallback)
export async function GET() {
    try {
        // First try to get URLs from settings table
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: Object.values(BRANDING_SETTINGS)
                }
            }
        })

        const urlMap: Record<string, string> = {}
        settings.forEach(s => {
            try {
                urlMap[s.key] = JSON.parse(s.value)
            } catch {
                urlMap[s.key] = s.value
            }
        })

        // Get URLs from settings or fallback to R2 scan
        let logoUrl = urlMap[BRANDING_SETTINGS.logo] || ""
        let faviconUrl = urlMap[BRANDING_SETTINGS.favicon] || ""
        let ogImageUrl = urlMap[BRANDING_SETTINGS.ogImage] || ""

        // If settings are empty, scan R2 for existing files
        if (!logoUrl) {
            logoUrl = await findBrandingFileInR2(BRANDING_PATHS.logo) || ""
        }
        if (!faviconUrl) {
            faviconUrl = await findBrandingFileInR2(BRANDING_PATHS.favicon) || ""
        }
        if (!ogImageUrl) {
            ogImageUrl = await findBrandingFileInR2(BRANDING_PATHS.ogImage) || ""
        }

        return NextResponse.json({
            logoUrl,
            faviconUrl,
            ogImageUrl,
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
        const url = getCdnUrl(filename)

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
