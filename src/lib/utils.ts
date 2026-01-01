import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import slugify from "slugify"

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Generate URL-friendly slug from title
 */
export function generateSlug(title: string): string {
    return slugify(title, {
        lower: true,
        strict: true,
        locale: "id",
    })
}

/**
 * Format number with Indonesian locale
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat("id-ID").format(num)
}

/**
 * Format currency in Rupiah
 */
export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

/**
 * Format relative time (e.g., "2 jam yang lalu")
 */
export function formatRelativeTime(date: Date, locale: string = "id"): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    const intervals = [
        { label: locale === "id" ? "tahun" : "year", seconds: 31536000 },
        { label: locale === "id" ? "bulan" : "month", seconds: 2592000 },
        { label: locale === "id" ? "minggu" : "week", seconds: 604800 },
        { label: locale === "id" ? "hari" : "day", seconds: 86400 },
        { label: locale === "id" ? "jam" : "hour", seconds: 3600 },
        { label: locale === "id" ? "menit" : "minute", seconds: 60 },
    ]

    for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds)
        if (count >= 1) {
            const suffix = locale === "id" ? " yang lalu" : count === 1 ? " ago" : "s ago"
            const plural = locale === "en" && count > 1 ? "s" : ""
            return `${count} ${interval.label}${plural}${suffix}`
        }
    }

    return locale === "id" ? "Baru saja" : "Just now"
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + "..."
}

/**
 * Calculate reading time
 */
export function calculateReadingTime(
    wordCount: number,
    wordsPerMinute: number = 200
): number {
    return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
    return text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Parse boolean from environment variable
 */
export function parseEnvBoolean(value: string | undefined): boolean {
    return value?.toLowerCase() === "true"
}

/**
 * Generate random string for tokens
 */
export function generateRandomString(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}
