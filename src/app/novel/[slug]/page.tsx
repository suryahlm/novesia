import Link from "next/link"
import Image from "next/image"
import {
    Star,
    Eye,
    BookOpen,
    Clock,
    Heart,
    Share2,
    ChevronRight,
    Crown,
    MessageSquare,
    List,
    User,
    Calendar,
} from "lucide-react"
import { formatNumber } from "@/lib/utils"

// Demo data - will be replaced with actual data fetch
const novel = {
    id: "1",
    title: "The Beginning After The End",
    slug: "the-beginning-after-the-end",
    synopsis: `Raja Arthur Leywin terlahir kembali sebagai bayi di dunia yang dipenuhi sihir dan monster. Meskipun telah hidup selama ratusan tahun dan mencapai puncak kekuatan sebagai raja, Arthur harus memulai kembali dari awal.

Dengan ingatan dan pengalaman dari kehidupan sebelumnya, ia bertekad untuk menjalani kehidupan barunya dengan cara yang berbeda. Tidak lagi terbelenggu oleh tanggung jawab kerajaan, ia ingin menjadi pelindung bagi orang-orang yang dicintainya.

Namun, takdir memiliki rencana lain. Kekuatan misterius mengancam kedamaian dunia, dan Arthur harus sekali lagi bangkit untuk melindungi yang tak berdaya. Dalam perjalanannya, ia akan menemukan rahasia tentang asal-usul sihir, makna sejati dari kekuatan, dan apa artinya menjadi manusia.`,
    cover: "https://picsum.photos/seed/novel1/400/600",
    author: "TurtleMe",
    status: "ONGOING" as const,
    rating: 4.9,
    ratingCount: 12500,
    views: 125000,
    bookmarks: 45000,
    isPremium: true,
    genres: ["Fantasy", "Action", "Reincarnation", "Magic"],
    createdAt: "2020-01-15",
}

const chapters = [
    { id: "ch1", number: 450, title: "The Final Battle Begins", updatedAt: "2024-01-01", isPremium: true, coinCost: 10 },
    { id: "ch2", number: 449, title: "Gathering of the Kings", updatedAt: "2023-12-28", isPremium: true, coinCost: 10 },
    { id: "ch3", number: 448, title: "Secrets Revealed", updatedAt: "2023-12-25", isPremium: true, coinCost: 10 },
    { id: "ch4", number: 447, title: "The Calm Before Storm", updatedAt: "2023-12-22", isPremium: false },
    { id: "ch5", number: 446, title: "Training Arc Ends", updatedAt: "2023-12-19", isPremium: false },
    { id: "ch6", number: 445, title: "New Powers Awakened", updatedAt: "2023-12-16", isPremium: false },
    { id: "ch7", number: 444, title: "The Hidden Valley", updatedAt: "2023-12-13", isPremium: false },
    { id: "ch8", number: 443, title: "Reunion", updatedAt: "2023-12-10", isPremium: false },
    { id: "ch9", number: 1, title: "New Beginning", updatedAt: "2020-01-15", isPremium: false },
]

const comments = [
    { id: "c1", user: { name: "Reader123", image: null }, content: "Novel ini luar biasa! Karakter utamanya sangat relate.", likes: 245, createdAt: "2 jam lalu" },
    { id: "c2", user: { name: "NovelFan", image: null }, content: "Terjemahannya sangat bagus, natural banget. Terima kasih Novesia!", likes: 189, createdAt: "5 jam lalu" },
    { id: "c3", user: { name: "Bookworm", image: null }, content: "Update chapter baru dong min 🙏", likes: 56, createdAt: "1 hari lalu" },
]

export default function NovelDetailPage({ params }: { params: { slug: string } }) {
    return (
        <div className="py-6">
            {/* Novel Header */}
            <section className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Cover */}
                <div className="w-48 mx-auto md:mx-0 flex-shrink-0">
                    <div className="card overflow-hidden">
                        <div className="relative aspect-book">
                            {novel.cover ? (
                                <Image
                                    src={novel.cover}
                                    alt={novel.title}
                                    fill
                                    priority
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                                    <BookOpen className="w-16 h-16 text-[var(--text-muted)]" />
                                </div>
                            )}
                            {novel.isPremium && (
                                <div className="absolute top-2 left-2">
                                    <span className="badge badge-premium">
                                        <Crown className="w-3 h-3 mr-1" />
                                        VIP
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">{novel.title}</h1>

                    <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--text-secondary)] mb-3">
                        <User className="w-4 h-4" />
                        <span>{novel.author}</span>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                        {novel.genres.map((genre) => (
                            <Link
                                key={genre}
                                href={`/genre/${genre.toLowerCase()}`}
                                className="badge badge-secondary hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                            >
                                {genre}
                            </Link>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                        <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                            <span className="font-bold">{novel.rating}</span>
                            <span className="text-sm text-[var(--text-muted)]">
                                ({formatNumber(novel.ratingCount)})
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <Eye className="w-4 h-4" />
                            <span>{formatNumber(novel.views)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <Heart className="w-4 h-4" />
                            <span>{formatNumber(novel.bookmarks)}</span>
                        </div>
                    </div>

                    {/* Status & Update */}
                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-[var(--text-secondary)] mb-6">
                        <span className="badge bg-blue-500 text-white">{novel.status}</span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {chapters.length} Chapter
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <Link
                            href={`/read/${chapters[chapters.length - 1].id}`}
                            className="btn btn-primary"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Mulai Baca
                        </Link>
                        <Link
                            href={`/read/${chapters[0].id}`}
                            className="btn btn-secondary"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Chapter Terbaru
                        </Link>
                        <button className="btn btn-ghost">
                            <Heart className="w-4 h-4 mr-2" />
                            Simpan
                        </button>
                        <button className="btn btn-ghost">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Synopsis */}
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                    Sinopsis
                </h2>
                <div className="card p-4">
                    <p className="whitespace-pre-line text-[var(--text-secondary)] leading-relaxed">
                        {novel.synopsis}
                    </p>
                </div>
            </section>

            {/* Chapter List */}
            <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <List className="w-5 h-5 text-[var(--color-primary)]" />
                        Daftar Chapter
                    </h2>
                    <button className="text-sm text-[var(--color-primary)] hover:underline">
                        Urutkan
                    </button>
                </div>
                <div className="card divide-y divide-[var(--bg-tertiary)]">
                    {chapters.map((chapter) => (
                        <Link
                            key={chapter.id}
                            href={`/read/${chapter.id}`}
                            className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-12 text-sm text-[var(--text-muted)]">
                                    Ch. {chapter.number}
                                </span>
                                <span className="font-medium">{chapter.title}</span>
                                {chapter.isPremium && (
                                    <span className="badge badge-premium text-xs">
                                        <Crown className="w-3 h-3 mr-0.5" />
                                        {chapter.coinCost}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-muted)]">
                                    {chapter.updatedAt}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="text-center mt-4">
                    <button className="btn btn-secondary">
                        Lihat Semua Chapter
                    </button>
                </div>
            </section>

            {/* Comments */}
            <section>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[var(--color-primary)]" />
                    Komentar ({comments.length})
                </h2>

                {/* Comment Input */}
                <div className="card p-4 mb-4">
                    <textarea
                        placeholder="Tulis komentarmu..."
                        className="input min-h-[100px] resize-none mb-3"
                    />
                    <div className="flex justify-end">
                        <button className="btn btn-primary">Kirim</button>
                    </div>
                </div>

                {/* Comment List */}
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="card p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                                    {comment.user.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{comment.user.name}</span>
                                        <span className="text-xs text-[var(--text-muted)]">{comment.createdAt}</span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] mb-2">{comment.content}</p>
                                    <button className="text-sm text-[var(--text-muted)] hover:text-[var(--color-primary)] flex items-center gap-1">
                                        <Heart className="w-4 h-4" />
                                        {comment.likes}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
