import Link from "next/link"
import {
  ChevronRight,
  TrendingUp,
  Clock,
  Star,
  Sparkles,
  BookOpen,
  Crown,
  ImageIcon,
} from "lucide-react"
import BookCard from "@/components/novel/BookCard"
import { prisma } from "@/lib/prisma"
import { getProxiedImageUrl } from "@/lib/image-utils"
import VipButton from "@/components/ui/VipButton"
import ContinueReadingSection from "@/components/home/ContinueReadingSection"
import HeroCarousel from "@/components/home/HeroCarousel"
import TopRankings from "@/components/home/TopRankings"

// Disable caching - always fetch fresh data
export const dynamic = "force-dynamic"

async function getVipPrice() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "vipMonthlyPrice" }
    })
    if (setting) {
      return JSON.parse(setting.value) as number
    }
  } catch (error) {
    console.error("Error fetching VIP price:", error)
  }
  return 49000 // Default
}

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
  const [featuredNovels, newReleases, topRated, genres, vipPrice] = await Promise.all([
    getFeaturedNovels(),
    getNewReleases(),
    getTopRated(),
    getGenres(),
    getVipPrice(),
  ])

  return (
    <div className="pb-4 sm:py-6 space-y-6 sm:space-y-10">
      {/* Hero Carousel - Featured Novels */}
      <HeroCarousel novels={featuredNovels} />

      {/* Continue Reading - Client Component */}
      <ContinueReadingSection />

      {/* Main Content with Sidebar Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-8">

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
              {genres.map((genre) => {
                const isImageUrl = genre.icon && (genre.icon.startsWith("http") || genre.icon.startsWith("/"))
                return (
                  <Link
                    key={genre.slug}
                    href={`/genre/${genre.slug}`}
                    className="card p-4 text-center hover:ring-2 hover:ring-[var(--color-primary)] transition-all"
                  >
                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-[var(--bg-tertiary)]">
                      {isImageUrl ? (
                        <img
                          src={getProxiedImageUrl(genre.icon) || genre.icon!}
                          alt={genre.name}
                          className="w-full h-full object-cover"
                        />
                      ) : genre.icon ? (
                        <span className="text-2xl">{genre.icon}</span>
                      ) : (
                        <BookOpen className="w-6 h-6 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <span className="font-medium text-sm block">{genre.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {genre._count.novels} novel
                    </span>
                  </Link>
                )
              })}
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
                Rp {vipPrice.toLocaleString("id-ID")}/bulan
              </Link>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          </section>
        </div>

        {/* Sidebar - Top Rankings + Donate */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-20 space-y-4">
            <TopRankings novels={topRated} title="🏆 Top Rankings" />

            {/* Donate Card */}
            <div className="card p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 21v-2h18v2H2zm2-4v-1c0-1.1.9-2 2-2h1V7H5V3h14v4h-2v7h1c1.1 0 2 .9 2 2v1H4zm4-3h8V7H8v7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Dukung Novesia ☕</h3>
                  <p className="text-xs text-[var(--text-muted)]">Bantuan kamu sangat berarti!</p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Suka dengan Novesia? Bantu kami tetap online dan berkembang dengan donasi!
              </p>
              <a
                href="https://saweria.co/novesia"
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:opacity-90 text-sm"
              >
                ☕ Traktir Kopi
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

