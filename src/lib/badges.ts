// Badge definitions with icons and unlock criteria
export interface Badge {
    id: string
    name: string
    description: string
    icon: string // Emoji icon
    category: "reading" | "social" | "streak" | "special"
    rarity: "common" | "rare" | "epic" | "legendary"
}

export const BADGES: Badge[] = [
    // Reading badges
    {
        id: "first_chapter",
        name: "Pembaca Pemula",
        description: "Baca chapter pertamamu",
        icon: "📖",
        category: "reading",
        rarity: "common",
    },
    {
        id: "bookworm_10",
        name: "Kutu Buku",
        description: "Baca 10 chapter",
        icon: "📚",
        category: "reading",
        rarity: "common",
    },
    {
        id: "reader_50",
        name: "Pembaca Setia",
        description: "Baca 50 chapter",
        icon: "🎓",
        category: "reading",
        rarity: "rare",
    },
    {
        id: "scholar_100",
        name: "Cendekiawan",
        description: "Baca 100 chapter",
        icon: "🏆",
        category: "reading",
        rarity: "epic",
    },
    {
        id: "master_500",
        name: "Master Pembaca",
        description: "Baca 500 chapter",
        icon: "👑",
        category: "reading",
        rarity: "legendary",
    },

    // Social badges
    {
        id: "first_comment",
        name: "Komentator",
        description: "Tulis komentar pertamamu",
        icon: "💬",
        category: "social",
        rarity: "common",
    },
    {
        id: "popular_10_likes",
        name: "Populer",
        description: "Dapat 10 likes di komentar",
        icon: "❤️",
        category: "social",
        rarity: "rare",
    },

    // Time-based badges
    {
        id: "night_owl",
        name: "Night Owl",
        description: "Baca di antara jam 12 malam - 5 pagi",
        icon: "🦉",
        category: "special",
        rarity: "rare",
    },
    {
        id: "early_bird",
        name: "Early Bird",
        description: "Baca di antara jam 5 - 8 pagi",
        icon: "🐦",
        category: "special",
        rarity: "rare",
    },

    // Streak badges
    {
        id: "streak_7",
        name: "Konsisten",
        description: "Login streak 7 hari berturut-turut",
        icon: "🔥",
        category: "streak",
        rarity: "rare",
    },
    {
        id: "streak_30",
        name: "Dedicated",
        description: "Login streak 30 hari berturut-turut",
        icon: "⚡",
        category: "streak",
        rarity: "epic",
    },

    // Special badges
    {
        id: "vip_member",
        name: "VIP Member",
        description: "Berlangganan VIP",
        icon: "💎",
        category: "special",
        rarity: "epic",
    },
    {
        id: "founding_member",
        name: "Founding Member",
        description: "Bergabung di awal Novesia",
        icon: "⭐",
        category: "special",
        rarity: "legendary",
    },
]

export function getBadgeById(id: string): Badge | undefined {
    return BADGES.find(badge => badge.id === id)
}

export function getBadgesByCategory(category: Badge["category"]): Badge[] {
    return BADGES.filter(badge => badge.category === category)
}

export const RARITY_COLORS = {
    common: "text-gray-500 bg-gray-100",
    rare: "text-blue-500 bg-blue-100",
    epic: "text-purple-500 bg-purple-100",
    legendary: "text-amber-500 bg-amber-100",
}
