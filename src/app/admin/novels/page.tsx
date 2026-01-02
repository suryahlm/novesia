import Link from "next/link"
import { Plus, Edit, Trash2, Eye, BookOpen } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

async function getNovels() {
    const novels = await prisma.novel.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { chapters: true } },
            genres: true,
        },
    })
    return novels
}

function getStatusBadge(status: string) {
    switch (status) {
        case "COMPLETED":
            return "bg-green-500 text-white"
        case "ONGOING":
            return "badge-primary"
        case "HIATUS":
            return "bg-yellow-500 text-white"
        case "DROPPED":
            return "bg-red-500 text-white"
        default:
            return "badge-secondary"
    }
}

export default async function AdminNovelsPage() {
    const novels = await getNovels()

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Kelola Novel</h1>
                    <p className="text-[var(--text-secondary)]">
                        Total: {novels.length} novel
                    </p>
                </div>
                <Link href="/admin/novels/new" className="btn btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Tambah Novel
                </Link>
            </div>

            {novels.length === 0 ? (
                <div className="card p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                    <h3 className="text-lg font-medium mb-2">Belum ada novel</h3>
                    <p className="text-[var(--text-muted)] mb-4">
                        Mulai dengan menambahkan novel pertamamu
                    </p>
                    <Link href="/admin/novels/new" className="btn btn-primary">
                        <Plus className="w-5 h-5 mr-2" />
                        Tambah Novel
                    </Link>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--bg-tertiary)]">
                                    <th className="text-left p-4 font-medium text-[var(--text-muted)]">Novel</th>
                                    <th className="text-left p-4 font-medium text-[var(--text-muted)]">Author</th>
                                    <th className="text-left p-4 font-medium text-[var(--text-muted)]">Status</th>
                                    <th className="text-center p-4 font-medium text-[var(--text-muted)]">Chapters</th>
                                    <th className="text-center p-4 font-medium text-[var(--text-muted)]">Views</th>
                                    <th className="text-center p-4 font-medium text-[var(--text-muted)]">Premium</th>
                                    <th className="text-right p-4 font-medium text-[var(--text-muted)]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--bg-tertiary)]">
                                {novels.map((novel) => (
                                    <tr key={novel.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {novel.cover ? (
                                                    <img
                                                        src={novel.cover}
                                                        alt={novel.title}
                                                        className="w-12 h-16 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-16 bg-[var(--bg-tertiary)] rounded flex items-center justify-center">
                                                        <BookOpen className="w-6 h-6 text-[var(--text-muted)]" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium line-clamp-1">{novel.title}</p>
                                                    <p className="text-sm text-[var(--text-muted)]">
                                                        {novel.genres.slice(0, 2).map(g => g.name).join(", ")}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">
                                            {novel.author || "-"}
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge ${getStatusBadge(novel.status)}`}>
                                                {novel.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {novel._count.chapters}
                                        </td>
                                        <td className="p-4 text-center">
                                            {formatNumber(novel.totalViews)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {novel.isPremium ? (
                                                <span className="badge badge-premium">Premium</span>
                                            ) : (
                                                <span className="text-[var(--text-muted)]">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/novel/${novel.slug}`}
                                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                    title="Lihat"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/novels/${novel.id}/edit`}
                                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
