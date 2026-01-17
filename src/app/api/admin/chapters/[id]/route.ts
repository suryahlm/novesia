import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Retrieve chapter detail for editing
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id: params.id },
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
        });

        if (!chapter) {
            return NextResponse.json(
                { success: false, error: "Chapter not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, chapter });
    } catch (error: any) {
        console.error("Error fetching chapter:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PATCH - Update chapter content and publish
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { contentTranslated, isPublished } = body;

        if (!contentTranslated) {
            return NextResponse.json(
                { success: false, error: "contentTranslated is required" },
                { status: 400 }
            );
        }

        // Calculate word count
        const wordCount = contentTranslated.trim().split(/\s+/).length;

        // Update chapter
        const updatedChapter = await prisma.chapter.update({
            where: { id: params.id },
            data: {
                contentTranslated,
                wordCount,
                isPublished: isPublished ?? false,
                publishedAt: isPublished ? new Date() : null,
            },
            include: {
                novel: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            chapter: updatedChapter,
        });
    } catch (error: any) {
        console.error("Error updating chapter:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Remove draft chapter
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if chapter exists and is draft
        const chapter = await prisma.chapter.findUnique({
            where: { id: params.id },
            select: { id: true, isPublished: true },
        });

        if (!chapter) {
            return NextResponse.json(
                { success: false, error: "Chapter not found" },
                { status: 404 }
            );
        }

        if (chapter.isPublished) {
            return NextResponse.json(
                { success: false, error: "Cannot delete published chapter" },
                { status: 400 }
            );
        }

        // Delete chapter
        await prisma.chapter.delete({
            where: { id: params.id },
        });

        return NextResponse.json({
            success: true,
            deleted: true,
        });
    } catch (error: any) {
        console.error("Error deleting chapter:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
