import Link from "next/link"
import { FileText, BookOpen, Eye, Edit, Plus } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import DeleteChapterButton from "@/components/admin/DeleteChapterButton"

async function getChapters() {
    const chapters = await prisma.chapter.findMany({
        orderBy: [
            { novel: { title: "asc" } },
            { chapterNumber: "asc" },
        ],
        include: {
            novel: {
                select: { id: true, title: true, slug: true },
            },
        },
    })
    return chapters
}

async function getChapterStats() {
    const [total, totalViews, novels] = await Promise.all([
        prisma.chapter.count(),
        prisma.chapter.aggregate({ _sum: { views: true } }),
        prisma.novel.count({ where: { chapters: { some: {} } } }),
    ])
    return {
        total,
        totalViews: totalViews._sum.views || 0,
        novelsWithChapters: novels,
    }
}

export default async function AdminChaptersPage() {
    const chapters = await getChapters()
    const stats = await getChapterStats()

    // Group chapters by novel
    const chaptersByNovel = chapters.reduce((acc, chapter) => {
        const novelId = chapter.novel.id
        if (!acc[novelId]) {
            acc[novelId] = {
                novel: chapter.novel,
                chapters: [],
            }
        }
        acc[novelId].chapters.push(chapter)
        return acc
    }, {} as Record<string, { novel: { id: string; title: string; slug: string }; chapters: typeof chapters }>)

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Kelola Chapter</h1>
                    <p className="text-[var(--text-secondary)]">
                        Total: {stats.total} chapter dari {stats.novelsWithChapters} novel
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-[var(--text-muted)]">Total Chapter</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
                        <p className="text-sm text-[var(--text-muted)]">Total Views</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.novelsWithChapters}</p>
                        <p className="text-sm text-[var(--text-muted)]">Novel dengan Chapter</p>
                    </div>
                </div>
            </div>

            {Object.keys(chaptersByNovel).length === 0 ? (
                <div className="card p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                    <h3 className="text-lg font-medium mb-2">Belum ada chapter</h3>
                    <p className="text-[var(--text-muted)] mb-4">
                        Tambahkan chapter ke novel yang sudah ada
                    </p>
                    <Link href="/admin/novels" className="btn btn-primary">
                        Lihat Daftar Novel
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.values(chaptersByNovel).map(({ novel, chapters: novelChapters }) => (
                        <div key={novel.id} className="card overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]">
                                <div>
                                    <Link
                                        href={`/novel/${novel.slug}`}
                                        className="font-semibold hover:text-[var(--color-primary)]"
                                    >
                                        {novel.title}
                                    </Link>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {novelChapters.length} chapter
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/novels/${novel.id}/chapters/new`}
                                    className="btn btn-secondary text-sm"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Tambah Chapter
                                </Link>
                            </div>
                            <div className="divide-y divide-[var(--bg-tertiary)]">
                                {novelChapters.map((chapter) => (
                                    <div
                                        key={chapter.id}
                                        className="flex items-center justify-between p-4 hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                Chapter {chapter.chapterNumber}: {chapter.title}
                                            </p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {chapter.wordCount} kata • {formatNumber(chapter.views)} views
                                                {chapter.isPremium && (
                                                    <span className="ml-2 badge badge-premium text-xs">Premium</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/novel/${novel.slug}/${chapter.chapterNumber}`}
                                                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                title="Lihat"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button
                                                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <DeleteChapterButton
                                                chapterId={chapter.id}
                                                chapterTitle={`Chapter ${chapter.chapterNumber}: ${chapter.title}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
