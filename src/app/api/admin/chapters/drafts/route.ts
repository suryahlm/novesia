import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const novelId = searchParams.get("novelId");
        const status = searchParams.get("status") || "draft"; // draft | published | all
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (novelId) {
            where.novelId = novelId;
        }

        if (status === "draft") {
            where.isPublished = false;
        } else if (status === "published") {
            where.isPublished = true;
        }
        // if "all", no filter on isPublished

        // Fetch chapters with novel info
        const [chapters, total] = await Promise.all([
            prisma.chapter.findMany({
                where,
                include: {
                    novel: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            cover: true,
                            status: true,
                        },
                    },
                },
                orderBy: [
                    { novel: { title: "asc" } },
                    { chapterNumber: "asc" },
                ],
                skip,
                take: limit,
            }),
            prisma.chapter.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            chapters,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("Error fetching draft chapters:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
