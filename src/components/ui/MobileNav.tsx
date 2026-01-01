"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Library, Gift, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
    locale?: "id" | "en"
}

const navItems = [
    { href: "/", icon: Home, label: { id: "Beranda", en: "Home" } },
    { href: "/discover", icon: Compass, label: { id: "Jelajahi", en: "Discover" } },
    { href: "/library", icon: Library, label: { id: "Pustaka", en: "Library" } },
    { href: "/rewards", icon: Gift, label: { id: "Hadiah", en: "Rewards" } },
    { href: "/profile", icon: User, label: { id: "Profil", en: "Profile" } },
]

export default function MobileNav({ locale = "id" }: MobileNavProps) {
    const pathname = usePathname()
    const t = (key: { id: string; en: string }) => key[locale]

    // Don't show on reader pages
    if (pathname.startsWith("/read/")) {
        return null
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-[var(--bg-tertiary)] md:hidden pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                                isActive
                                    ? "text-[var(--color-primary)]"
                                    : "text-[var(--text-muted)]"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-6 h-6 transition-transform",
                                    isActive && "scale-110"
                                )}
                            />
                            <span className="text-[10px] mt-1 font-medium">{t(item.label)}</span>
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--color-primary)] rounded-b-full" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
