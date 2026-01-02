import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"

async function getGenres() {
    const genres = await prisma.genre.findMany({
        include: {
            _count: { select: { novels: true } },
        },
        orderBy: { name: "asc" },
    })
    return genres
}

const genreColors = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-green-500",
    "from-amber-500 to-orange-500",
]

export default async function GenrePage() {
    const genres = await getGenres()

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Jelajahi Genre</h1>
                    <p className="text-[var(--text-muted)]">
                        Pilih genre favorit kamu
                    </p>
                </div>

                {/* Genre Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {genres.map((genre, index) => (
                        <Link
                            key={genre.id}
                            href={`/genre/${genre.slug}`}
                            className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${genreColors[index % genreColors.length]} hover:scale-[1.02] transition-transform`}
                        >
                            <div className="relative z-10">
                                <h3 className="text-white font-bold text-lg mb-1">
                                    {genre.name}
                                </h3>
                                <p className="text-white/70 text-sm">
                                    {genre._count.novels} novel
                                </p>
                            </div>
                            <BookOpen className="absolute right-4 bottom-4 w-16 h-16 text-white/20" />
                        </Link>
                    ))}
                </div>

                {genres.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                        Belum ada genre tersedia
                    </div>
                )}
            </div>
        </div>
    )
}
