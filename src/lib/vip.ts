import { prisma } from "./prisma"

/**
 * Check if VIP has expired and reset status if needed
 * Returns the current VIP status after check
 */
export async function checkAndUpdateVipStatus(userId: string): Promise<{
    isVip: boolean
    vipExpiresAt: Date | null
    wasExpired: boolean
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVip: true, vipExpiresAt: true },
    })

    if (!user) {
        return { isVip: false, vipExpiresAt: null, wasExpired: false }
    }

    const now = new Date()

    // If user is VIP but has expired
    if (user.isVip && user.vipExpiresAt && user.vipExpiresAt < now) {
        // Reset VIP status
        await prisma.user.update({
            where: { id: userId },
            data: { isVip: false },
        })

        return { isVip: false, vipExpiresAt: user.vipExpiresAt, wasExpired: true }
    }

    return {
        isVip: user.isVip,
        vipExpiresAt: user.vipExpiresAt,
        wasExpired: false
    }
}

/**
 * Grant VIP status to a user for a specific duration
 */
export async function grantVip(
    userId: string,
    durationDays: number
): Promise<{ isVip: boolean; vipExpiresAt: Date }> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVip: true, vipExpiresAt: true },
    })

    const now = new Date()
    let newExpiresAt: Date

    // If already VIP and not expired, extend from current expiry
    if (user?.isVip && user.vipExpiresAt && user.vipExpiresAt > now) {
        newExpiresAt = new Date(user.vipExpiresAt.getTime() + durationDays * 24 * 60 * 60 * 1000)
    } else {
        // Start fresh from now
        newExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            isVip: true,
            vipExpiresAt: newExpiresAt,
        },
    })

    return { isVip: true, vipExpiresAt: newExpiresAt }
}

/**
 * VIP package definitions
 * Coin prices slightly higher than direct purchase to incentivize direct payment
 * Base rate: 1 koin = Rp 100, VIP coins priced ~10% higher
 */
export const VIP_PACKAGES = [
    {
        id: "vip_1_month",
        name: "VIP 1 Bulan",
        durationDays: 30,
        priceCoins: 550, // Rp 49,000 direct vs 550 koin (~Rp 55,000 in coins)
        priceIdr: 49000,
        discount: 0,
    },
    {
        id: "vip_3_months",
        name: "VIP 3 Bulan",
        durationDays: 90,
        priceCoins: 1400, // Rp 127,000 direct vs 1400 koin (~Rp 140,000 in coins)
        priceIdr: 127000,
        discount: 14, // Save ~14% vs monthly
    },
    {
        id: "vip_1_year",
        name: "VIP 1 Tahun",
        durationDays: 365,
        priceCoins: 4500, // Rp 399,000 direct vs 4500 koin (~Rp 450,000 in coins)
        priceIdr: 399000,
        discount: 32, // Save ~32% vs monthly
    },
]

export function getVipPackageById(id: string) {
    return VIP_PACKAGES.find(pkg => pkg.id === id)
}
