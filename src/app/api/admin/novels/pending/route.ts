import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const filter = searchParams.get("filter") || "all"; // all | complete | ongoing
        const sort = searchParams.get("sort") || "drafts"; // drafts | latest | title
        const search = searchParams.get("search") || "";

        // Build where clause
        const where: any = {
            chapters: {
                some: {
                    isPublished: false, // Must have at least 1 draft chapter
                },
            },
        };

        // Filter by novel status
        if (filter === "complete") {
            where.status = "COMPLETED";
        } else if (filter === "ongoing") {
            where.status = "ONGOING";
        }

        // Search by title
        if (search) {
            where.title = {
                contains: search,
                mode: "insensitive",
            };
        }

        // Fetch novels with draft chapter counts
        const novels = await prisma.novel.findMany({
            where,
            include: {
                chapters: {
                    select: {
                        id: true,
                        chapterNumber: true,
                        isPublished: true,
                        createdAt: true,
                    },
                },
                genres: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        // Transform data: calculate counts and latest draft
        const novelsWithCounts = novels.map((novel) => {
            const draftChapters = novel.chapters.filter((ch) => !ch.isPublished);
            const publishedChapters = novel.chapters.filter((ch) => ch.isPublished);

            const latestDraft = draftChapters.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            )[0];

            return {
                id: novel.id,
                title: novel.title,
                slug: novel.slug,
                cover: novel.cover,
                synopsis: novel.synopsis,
                author: novel.author,
                status: novel.status,
                genres: novel.genres,
                _count: {
                    draftChapters: draftChapters.length,
                    publishedChapters: publishedChapters.length,
                    totalChapters: novel.chapters.length,
                },
                latestDraft: latestDraft
                    ? {
                        chapterNumber: latestDraft.chapterNumber,
                        createdAt: latestDraft.createdAt,
                    }
                    : null,
            };
        });

        // Apply sorting
        let sortedNovels = novelsWithCounts;
        if (sort === "drafts") {
            sortedNovels.sort(
                (a, b) => b._count.draftChapters - a._count.draftChapters
            );
        } else if (sort === "latest") {
            sortedNovels.sort((a, b) => {
                const aTime = a.latestDraft?.createdAt?.getTime() || 0;
                const bTime = b.latestDraft?.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        } else if (sort === "title") {
            sortedNovels.sort((a, b) => a.title.localeCompare(b.title));
        }

        return NextResponse.json({
            success: true,
            novels: sortedNovels,
            total: sortedNovels.length,
        });
    } catch (error: any) {
        console.error("Error fetching pending novels:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
