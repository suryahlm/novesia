import Link from "next/link"
import { Crown, TrendingUp, Star, Eye } from "lucide-react"
import { getProxiedImageUrl } from "@/lib/image-utils"
import { formatNumber } from "@/lib/utils"

interface Novel {
    id: string
    title: string
    slug: string
    cover: string | null
    avgRating: number
    totalViews: number
    status: string
}

interface TopRankingsProps {
    novels: Novel[]
    title?: string
}

export default function TopRankings({ novels, title = "Top Rankings" }: TopRankingsProps) {
    if (!novels.length) return null

    // Medal colors for top 3
    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 1: return "from-yellow-400 to-yellow-600" // Gold
            case 2: return "from-gray-300 to-gray-500" // Silver
            case 3: return "from-amber-600 to-amber-800" // Bronze
            default: return "from-[var(--bg-tertiary)] to-[var(--bg-secondary)]"
        }
    }

    return (
        <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-lg">{title}</h3>
            </div>

            <div className="space-y-3">
                {novels.slice(0, 10).map((novel, index) => (
                    <Link
                        key={novel.id}
                        href={`/novel/${novel.slug}`}
                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
                    >
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getMedalColor(index + 1)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                            {index + 1}
                        </div>

                        {/* Cover */}
                        <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
                            {novel.cover ? (
                                <img
                                    src={getProxiedImageUrl(novel.cover) || novel.cover}
                                    alt={novel.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-purple-600" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                                {novel.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-0.5">
                                <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    {novel.avgRating.toFixed(1)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {formatNumber(novel.totalViews)}
                                </span>
                            </div>
                        </div>

                        {/* Trend Arrow */}
                        <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                ))}
            </div>
        </div>
    )
}
