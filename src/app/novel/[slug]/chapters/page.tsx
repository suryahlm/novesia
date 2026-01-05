import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, List } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { ChapterList } from "./ChapterList"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ slug: string }>
}

async function getNovelWithChapters(slug: string) {
    const novel = await prisma.novel.findUnique({
        where: { slug },
        include: {
            chapters: {
                orderBy: { chapterNumber: "asc" },
                select: {
                    id: true,
                    chapterNumber: true,
                    title: true,
                    isPremium: true,
                    coinCost: true,
                    createdAt: true,
                },
            },
        },
    })
    return novel
}

export default async function NovelChaptersPage({ params }: PageProps) {
    const { slug } = await params
    const novel = await getNovelWithChapters(slug)

    if (!novel) {
        notFound()
    }

    return (
        <div className="py-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={`/novel/${novel.slug}`}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{novel.title}</h1>
                    <p className="text-[var(--text-secondary)]">
                        {novel.chapters.length} Chapter
                    </p>
                </div>
            </div>

            {/* Chapter List - Client Component */}
            <ChapterList
                chapters={novel.chapters.map(ch => ({
                    id: ch.id,
                    chapterNumber: ch.chapterNumber,
                    title: ch.title,
                    isPremium: ch.isPremium,
                    coinCost: ch.coinCost,
                    createdAt: ch.createdAt.toISOString(),
                }))}
                novelSlug={novel.slug}
            />
        </div>
    )
}
