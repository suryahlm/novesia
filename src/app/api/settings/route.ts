import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get all settings
export async function GET() {
    try {
        const settings = await prisma.setting.findMany()

        // Convert to key-value object
        const settingsObject = settings.reduce((acc, setting) => {
            try {
                acc[setting.key] = JSON.parse(setting.value)
            } catch {
                acc[setting.key] = setting.value
            }
            return acc
        }, {} as Record<string, unknown>)

        // Default coin packages
        const defaultCoinPackages = [
            { id: 1, name: "Starter", coins: 100, price: 5000, bonus: 0 },
            { id: 2, name: "Basic", coins: 250, price: 10000, bonus: 25 },
            { id: 3, name: "Popular", coins: 500, price: 20000, bonus: 100, isPopular: true },
            { id: 4, name: "Best Value", coins: 1000, price: 40000, bonus: 300 },
            { id: 5, name: "Ultimate", coins: 2500, price: 80000, bonus: 1000 },
        ]

        // Return with defaults
        return NextResponse.json({
            siteName: settingsObject.siteName || "Novesia",
            siteDescription: settingsObject.siteDescription || "Platform novel terbaik Indonesia",
            maintenanceMode: settingsObject.maintenanceMode || false,
            registrationEnabled: settingsObject.registrationEnabled !== false,
            requireEmailVerification: settingsObject.requireEmailVerification || false,
            defaultUserCoins: settingsObject.defaultUserCoins || 50,
            vipMonthlyPrice: settingsObject.vipMonthlyPrice || 20000,
            vipQuarterlyPrice: settingsObject.vipQuarterlyPrice || 55000,
            vipYearlyPrice: settingsObject.vipYearlyPrice || 190000,
            coinPackages: settingsObject.coinPackages || defaultCoinPackages,
            coinPurchaseEnabled: settingsObject.coinPurchaseEnabled !== false,
            googleLoginEnabled: settingsObject.googleLoginEnabled !== false,
            maxUploadSize: settingsObject.maxUploadSize || 5,
            scraperEnabled: settingsObject.scraperEnabled !== false,
            translationEnabled: settingsObject.translationEnabled !== false,
            donationLink: settingsObject.donationLink || "https://saweria.co/novesia",
        })
    } catch (error) {
        console.error("Error fetching settings:", error)
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        })
        if (user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()

        // Upsert each setting
        const updates = Object.entries(body).map(([key, value]) =>
            prisma.setting.upsert({
                where: { key },
                create: {
                    key,
                    value: JSON.stringify(value),
                },
                update: {
                    value: JSON.stringify(value),
                },
            })
        )

        await prisma.$transaction(updates)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating settings:", error)
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
}
