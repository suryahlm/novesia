import Link from "next/link"
import {
  ChevronRight,
  TrendingUp,
  Clock,
  Star,
  Sparkles,
  BookOpen,
  Crown,
} from "lucide-react"
import BookCard from "@/components/novel/BookCard"
import { prisma } from "@/lib/prisma"

async function getFeaturedNovels() {
  return prisma.novel.findMany({
    orderBy: { totalViews: "desc" },
    take: 5,
    include: {
      genres: true,
      _count: { select: { chapters: true } },
    },
  })
}

async function getNewReleases() {
  return prisma.novel.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      genres: true,
      _count: { select: { chapters: true } },
    },
  })
}

async function getTopRated() {
  return prisma.novel.findMany({
    orderBy: { avgRating: "desc" },
    take: 10,
    include: {
      genres: true,
      _count: { select: { chapters: true } },
    },
  })
}

async function getGenres() {
  return prisma.genre.findMany({
    include: {
      _count: { select: { novels: true } },
    },
  })
}

function SectionHeader({
  icon: Icon,
  title,
  href,
  viewAllText = "Lihat Semua",
}: {
  icon: React.ElementType
  title: string
  href: string
  viewAllText?: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-[var(--color-primary)]" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <Link
        href={href}
        className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
      >
        {viewAllText}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export default async function HomePage() {
  const [featuredNovels, newReleases, topRated, genres] = await Promise.all([
    getFeaturedNovels(),
    getNewReleases(),
    getTopRated(),
    getGenres(),
  ])

  return (
    <div className="py-4 sm:py-6 space-y-8 sm:space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-purple-600 to-[var(--color-secondary)] p-6 sm:p-10 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider opacity-90">
              Selamat Datang di
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Novesia
          </h1>
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mb-6">
            Jelajahi ribuan novel terjemahan berkualitas dengan pengalaman membaca
            yang imersif. Baca kapan saja, di mana saja.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="btn bg-white text-[var(--color-primary)] hover:bg-white/90"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Mulai Baca
            </Link>
            <Link
              href="/rewards"
              className="btn border-2 border-white/50 hover:bg-white/10"
            >
              <Crown className="w-4 h-4 mr-2" />
              Gabung VIP
            </Link>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
      </section>

      {/* Trending Section */}
      <section>
        <SectionHeader
          icon={TrendingUp}
          title="Trending Sekarang"
          href="/discover?sort=trending"
        />
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {featuredNovels.map((novel) => (
            <BookCard
              key={novel.id}
              id={novel.id}
              title={novel.title}
              slug={novel.slug}
              cover={novel.cover}
              author={novel.author}
              rating={novel.avgRating}
              views={novel.totalViews}
              chaptersCount={novel._count.chapters}
              status={novel.status}
              isPremium={novel.isPremium}
              isHot={novel.totalViews > 50000}
              size="lg"
            />
          ))}
        </div>
      </section>

      {/* New Releases */}
      <section>
        <SectionHeader
          icon={Clock}
          title="Baru Rilis"
          href="/discover?sort=newest"
        />
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {newReleases.map((novel) => (
            <BookCard
              key={novel.id}
              id={novel.id}
              title={novel.title}
              slug={novel.slug}
              cover={novel.cover}
              author={novel.author}
              rating={novel.avgRating}
              views={novel.totalViews}
              chaptersCount={novel._count.chapters}
              status={novel.status}
              isPremium={novel.isPremium}
              isNew
            />
          ))}
        </div>
      </section>

      {/* Genres Grid */}
      <section>
        <SectionHeader
          icon={Star}
          title="Jelajahi Genre"
          href="/genre"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {genres.map((genre) => (
            <Link
              key={genre.slug}
              href={`/genre/${genre.slug}`}
              className="card p-4 text-center hover:ring-2 hover:ring-[var(--color-primary)] transition-all"
            >
              <span className="text-2xl mb-2 block">{genre.icon}</span>
              <span className="font-medium text-sm block">{genre.name}</span>
              <span className="text-xs text-[var(--text-muted)]">
                {genre._count.novels} novel
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Rated */}
      <section>
        <SectionHeader
          icon={Star}
          title="Rating Tertinggi"
          href="/discover?sort=rating"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {topRated.map((novel) => (
            <BookCard
              key={novel.id}
              id={novel.id}
              title={novel.title}
              slug={novel.slug}
              cover={novel.cover}
              author={novel.author}
              rating={novel.avgRating}
              views={novel.totalViews}
              chaptersCount={novel._count.chapters}
              status={novel.status}
              isPremium={novel.isPremium}
            />
          ))}
        </div>
      </section>

      {/* VIP Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-6 sm:p-8 text-white">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Upgrade ke VIP</h3>
              <p className="text-sm opacity-90">
                Akses semua novel premium, bebas iklan, bonus koin harian
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="btn bg-white text-amber-600 hover:bg-white/90 whitespace-nowrap"
          >
            Rp 15.000/bulan
          </Link>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      </section>
    </div>
  )
}
