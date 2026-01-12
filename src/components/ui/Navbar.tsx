"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
    Menu,
    X,
    Search,
    BookOpen,
    LogIn,
    Globe,
    Home,
    Compass,
    Library,
    Gift,
    Coins,
    LogOut,
    MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import InstallAppButton from "@/components/ui/InstallAppButton"
import ThemeToggle from "@/components/ui/ThemeToggle"

interface NavbarProps {
    locale?: "id" | "en"
}

const navItems = [
    { href: "/", label: { id: "Beranda", en: "Home" }, icon: Home },
    { href: "/discover", label: { id: "Jelajahi", en: "Discover" }, icon: Compass },
    { href: "/english-novels", label: { id: "English Novels", en: "English Novels" }, icon: Globe },
    { href: "/genre", label: { id: "Genre", en: "Genre" }, icon: BookOpen },
]

const userNavItems = [
    { href: "/library", label: { id: "Pustaka", en: "Library" }, icon: Library },
    { href: "/forum", label: { id: "Forum", en: "Forum" }, icon: MessageCircle },
    { href: "/rewards", label: { id: "Hadiah", en: "Rewards" }, icon: Gift },
]

export default function Navbar({ locale = "id" }: NavbarProps) {
    const { data: session, status } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const pathname = usePathname()

    const user = session?.user
    const isLoading = status === "loading"
    const [userCoins, setUserCoins] = useState<number | null>(null)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)

    // Fetch branding logo
    useEffect(() => {
        fetch("/api/admin/branding")
            .then(res => res.json())
            .then(data => {
                if (data.logoUrl) {
                    setLogoUrl(data.logoUrl)
                }
            })
            .catch(() => { })
    }, [])

    // Fetch user coins when logged in
    useEffect(() => {
        if (user?.id) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    if (data.coins !== undefined) {
                        setUserCoins(data.coins)
                    }
                })
                .catch(() => setUserCoins(0))
        }
    }, [user?.id])

    const t = (key: { id: string; en: string }) => key[locale]

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" })
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            window.location.href = `/discover?q=${encodeURIComponent(searchQuery.trim())}`
            setIsSearchOpen(false)
            setSearchQuery("")
        }
    }

    return (
        <>
            {/* Main Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Novesia" className="h-12 w-auto object-contain" />
                            ) : (
                                <>
                                    <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
                                    <span className="text-xl font-bold gradient-text hidden sm:block">
                                        Novesia
                                    </span>
                                </>
                            )}
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-[var(--color-primary)] text-white"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                                    )}
                                >
                                    {t(item.label)}
                                </Link>
                            ))}
                            {user && userNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-[var(--color-primary)] text-white"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                                    )}
                                >
                                    {t(item.label)}
                                </Link>
                            ))}
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-2">
                            {/* Install App Button */}
                            <InstallAppButton />

                            {/* Search Button */}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                                aria-label="Search"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Language Switcher */}
                            <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors hidden sm:flex items-center gap-1 text-sm">
                                <Globe className="w-4 h-4" />
                                <span className="uppercase">{locale}</span>
                            </button>

                            {/* User Section */}
                            {isLoading ? (
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
                            ) : user ? (
                                <div className="flex items-center gap-2 relative">
                                    {/* Coins */}
                                    <Link
                                        href="/coins"
                                        className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] text-sm font-medium"
                                    >
                                        <Coins className="w-4 h-4 text-[var(--color-accent)]" />
                                        <span>{userCoins !== null ? userCoins.toLocaleString() : "..."}</span>
                                    </Link>

                                    {/* Profile Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors"
                                        >
                                            {user.image ? (
                                                <img
                                                    src={user.image}
                                                    alt={user.name || "User"}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-medium">
                                                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                                                </div>
                                            )}
                                        </button>

                                        {/* Profile Dropdown Menu */}
                                        {isProfileMenuOpen && (
                                            <div className="absolute right-0 top-12 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg border border-[var(--bg-tertiary)] py-2 animate-fade-in">
                                                <div className="px-4 py-2 border-b border-[var(--bg-tertiary)]">
                                                    <p className="font-medium text-sm truncate">{user.name || "User"}</p>
                                                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                                                </div>
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                    className="block px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                                                >
                                                    Profil Saya
                                                </Link>
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                    className="block px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                                                >
                                                    Admin Panel
                                                </Link>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Keluar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="btn btn-primary text-sm"
                                >
                                    <LogIn className="w-4 h-4 mr-2" />
                                    {t({ id: "Masuk", en: "Login" })}
                                </Link>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors md:hidden"
                                aria-label="Menu"
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-[var(--bg-tertiary)] animate-slide-up">
                        <div className="px-4 py-3 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-[var(--color-primary)] text-white"
                                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {t(item.label)}
                                </Link>
                            ))}
                            {user && userNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-[var(--color-primary)] text-white"
                                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {t(item.label)}
                                </Link>
                            ))}
                            {user && (
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Keluar
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100]" onClick={() => setIsSearchOpen(false)}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Search Container */}
                    <div
                        className="absolute top-0 left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--bg-tertiary)] shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto p-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t({ id: "Cari novel...", en: "Search novels..." })}
                                    className="w-full pl-12 pr-12 py-3 text-lg bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--text-primary)]"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(false)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Click outside to close profile menu */}
            {isProfileMenuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                />
            )}
        </>
    )
}
