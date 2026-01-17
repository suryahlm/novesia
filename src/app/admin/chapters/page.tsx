import Link from "next/link"
import { FileText, BookOpen, Eye, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import NovelChapterAccordion from "@/components/admin/NovelChapterAccordion"

const ITEMS_PER_PAGE = 10

async function getNovels(page: number = 1) {
    const skip = (page - 1) * ITEMS_PER_PAGE

    const [novels, totalCount] = await Promise.all([
        prisma.novel.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: ITEMS_PER_PAGE,
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
        }),
        prisma.novel.count(),
    ])

    return {
        novels,
        totalCount,
        totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
        currentPage: page,
    }
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

interface Props {
    searchParams: Promise<{ page?: string }>
}

export default async function AdminChaptersPage({ searchParams }: Props) {
    const params = await searchParams
    const currentPage = Math.max(1, parseInt(params.page || "1"))

    const { novels, totalPages } = await getNovels(currentPage)
    const stats = await getChapterStats()

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible + 2) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Always show first page
            pages.push(1)

            // Calculate start and end of visible range
            let start = Math.max(2, currentPage - 1)
            let end = Math.min(totalPages - 1, currentPage + 1)

            // Adjust if at the beginning
            if (currentPage <= 3) {
                start = 2
                end = Math.min(maxVisible, totalPages - 1)
            }

            // Adjust if at the end
            if (currentPage >= totalPages - 2) {
                start = Math.max(2, totalPages - maxVisible + 1)
                end = totalPages - 1
            }

            // Add ellipsis before if needed
            if (start > 2) {
                pages.push("...")
            }

            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            // Add ellipsis after if needed
            if (end < totalPages - 1) {
                pages.push("...")
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages)
            }
        }

        return pages
    }

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
                <>
                    <NovelChapterAccordion novels={novels} />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {/* Previous Button */}
                            {currentPage > 1 ? (
                                <Link
                                    href={`/admin/chapters?page=${currentPage - 1}`}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Prev</span>
                                </Link>
                            ) : (
                                <span className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed opacity-50">
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Prev</span>
                                </span>
                            )}

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((page, index) => (
                                    page === "..." ? (
                                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-[var(--text-muted)]">
                                            ...
                                        </span>
                                    ) : (
                                        <Link
                                            key={page}
                                            href={`/admin/chapters?page=${page}`}
                                            className={`px-3 py-2 rounded-lg transition-colors ${currentPage === page
                                                    ? "bg-[var(--color-primary)] text-white font-medium"
                                                    : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                                                }`}
                                        >
                                            {page}
                                        </Link>
                                    )
                                ))}
                            </div>

                            {/* Next Button */}
                            {currentPage < totalPages ? (
                                <Link
                                    href={`/admin/chapters?page=${currentPage + 1}`}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <span className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed opacity-50">
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                    )}

                    {/* Page Info */}
                    <p className="text-center text-sm text-[var(--text-muted)] mt-3">
                        Halaman {currentPage} dari {totalPages}
                    </p>
                </>
            )}
        </div>
    )
}
