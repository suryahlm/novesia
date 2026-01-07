import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { getProxiedImageUrl } from "@/lib/image-utils"

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
                    {genres.map((genre) => (
                        <Link
                            key={genre.id}
                            href={`/genre/${genre.slug}`}
                            className="relative overflow-hidden rounded-xl aspect-[4/3] group hover:scale-[1.02] transition-transform"
                        >
                            {/* Background Image or Fallback */}
                            {genre.icon && (genre.icon.startsWith("http") || genre.icon.startsWith("/")) ? (
                                <img
                                    src={getProxiedImageUrl(genre.icon) || genre.icon}
                                    alt={genre.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)]" />
                            )}

                            {/* Dark Overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                            {/* Content */}
                            <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                <h3 className="text-white font-bold text-lg mb-0.5 drop-shadow-lg">
                                    {genre.name}
                                </h3>
                                <p className="text-white/80 text-sm">
                                    {genre._count.novels} novel
                                </p>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-[var(--color-primary)]/0 group-hover:bg-[var(--color-primary)]/10 transition-colors" />
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

