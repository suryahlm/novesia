import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

// R2 Configuration
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ""
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ""
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "novesia-assets"
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-d7fdf7a6932b4febbd724bd48ae0c2c3.r2.dev"
const R2_ENDPOINT = process.env.R2_ENDPOINT || "https://caa84fe6b1be065cda3836f0dac4b509.r2.cloudflarestorage.com"

// Create S3 client for R2
// IMPORTANT: forcePathStyle must be true for Cloudflare R2
const r2Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    forcePathStyle: true, // Required for R2
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
})

/**
 * Upload a file to R2
 * @param file - File buffer or Blob
 * @param key - Object key (path in bucket, e.g., "covers/novel-slug.jpg")
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
    file: Buffer | Uint8Array,
    key: string,
    contentType: string
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    })

    await r2Client.send(command)

    return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Delete a file from R2
 * @param key - Object key to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    })

    await r2Client.send(command)
}

/**
 * Get public URL for a file in R2
 * @param key - Object key
 * @returns Public URL
 */
export function getR2PublicUrl(key: string): string {
    return `${R2_PUBLIC_URL}/${key}`
}

/**
 * Upload image from URL to R2 (useful for scraper)
 * @param imageUrl - URL of the image to fetch and upload
 * @param key - Object key for the uploaded file
 * @returns Public URL of the uploaded file
 */
export async function uploadImageFromUrl(
    imageUrl: string,
    key: string
): Promise<string> {
    const response = await fetch(imageUrl)

    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type") || "image/jpeg"
    const buffer = Buffer.from(await response.arrayBuffer())

    return uploadToR2(buffer, key, contentType)
}

/**
 * Generate a unique key for novel cover
 * @param novelSlug - Novel slug
 * @param extension - File extension (default: jpg)
 */
export function generateCoverKey(novelSlug: string, extension = "jpg"): string {
    return `covers/${novelSlug}.${extension}`
}

/**
 * Generate a unique key for chapter image
 * @param novelSlug - Novel slug
 * @param chapterNumber - Chapter number
 * @param imageIndex - Image index in chapter
 * @param extension - File extension
 */
export function generateChapterImageKey(
    novelSlug: string,
    chapterNumber: number,
    imageIndex: number,
    extension = "jpg"
): string {
    return `chapters/${novelSlug}/${chapterNumber}/${imageIndex}.${extension}`
}

export { r2Client }
