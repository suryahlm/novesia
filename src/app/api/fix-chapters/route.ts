import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
    try {
        // Update all existing chapters to set isPublished = true
        const result = await prisma.chapter.updateMany({
            where: {
                isPublished: false,
            },
            data: {
                isPublished: true,
                publishedAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            message: `Updated ${result.count} chapters to published status`,
            count: result.count,
        })

    } catch (error: any) {
        console.error("Fix chapters error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
