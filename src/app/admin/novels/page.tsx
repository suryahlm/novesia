import Link from "next/link"
import { Plus, BookOpen } from "lucide-react"
import { prisma } from "@/lib/prisma"
import NovelsTable from "@/components/admin/NovelsTable"

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
                <NovelsTable novels={novels} />
            )}
        </div>
    )
}
