/**
 * Get proxied URL for R2 images to bypass SSL cert issues
 * Only use for R2 URLs - other URLs should be used directly
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
    if (!url) return null

    // Check if it's an R2 URL that needs proxying
    const r2Domains = ["r2.dev", "r2.cloudflarestorage.com"]
    const isR2Url = r2Domains.some(domain => url.includes(domain))

    if (!isR2Url) {
        // Return original URL for non-R2 images
        return url
    }

    // Return proxied URL
    return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

/**
 * Check if URL is from R2 storage
 */
export function isR2Url(url: string | null | undefined): boolean {
    if (!url) return false
    const r2Domains = ["r2.dev", "r2.cloudflarestorage.com"]
    return r2Domains.some(domain => url.includes(domain))
}
