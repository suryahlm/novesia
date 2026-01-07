import Link from "next/link"
import { FileText, BookOpen, Eye, Plus } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import NovelChapterAccordion from "@/components/admin/NovelChapterAccordion"

async function getAllNovels() {
    const novels = await prisma.novel.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            chapters: {
                orderBy: { chapterNumber: "asc" },
                select: {
                    id: true,
                    chapterNumber: true,
                    title: true,
                    wordCount: true,
                    views: true,
                    isPremium: true,
                },
            },
        },
    })
    return novels
}

async function getChapterStats() {
    const [total, totalViews, totalNovels] = await Promise.all([
        prisma.chapter.count(),
        prisma.chapter.aggregate({ _sum: { views: true } }),
        prisma.novel.count(),
    ])
    return {
        total,
        totalViews: totalViews._sum.views || 0,
        totalNovels,
    }
}

export default async function AdminChaptersPage() {
    const novels = await getAllNovels()
    const stats = await getChapterStats()

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Kelola Chapter</h1>
                    <p className="text-[var(--text-secondary)]">
                        Total: {stats.total} chapter dari {stats.totalNovels} novel
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
                        <p className="text-2xl font-bold">{stats.totalNovels}</p>
                        <p className="text-sm text-[var(--text-muted)]">Total Novel</p>
                    </div>
                </div>
            </div>

            {novels.length === 0 ? (
                <div className="card p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                    <h3 className="text-lg font-medium mb-2">Belum ada novel</h3>
                    <p className="text-[var(--text-muted)] mb-4">
                        Tambahkan novel terlebih dahulu
                    </p>
                    <Link href="/admin/novels/new" className="btn btn-primary">
                        <Plus className="w-5 h-5 mr-2" />
                        Tambah Novel
                    </Link>
                </div>
            ) : (
                <NovelChapterAccordion novels={novels} />
            )}
        </div>
    )
}

