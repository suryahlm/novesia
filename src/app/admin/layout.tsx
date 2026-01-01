import Link from "next/link"
import { ReactNode } from "react"
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Users,
    Settings,
    Download,
    BarChart3,
    LogOut,
    ChevronLeft,
} from "lucide-react"

const sidebarItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/novels", icon: BookOpen, label: "Novel" },
    { href: "/admin/chapters", icon: FileText, label: "Chapter" },
    { href: "/admin/scraper", icon: Download, label: "Scraper" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--bg-tertiary)] hidden lg:block">
                <div className="p-4 border-b border-[var(--bg-tertiary)]">
                    <Link href="/" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm">Kembali ke Website</span>
                    </Link>
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 flex items-center justify-center text-white font-bold">
                            N
                        </div>
                        <div>
                            <p className="font-semibold">Novesia</p>
                            <p className="text-xs text-[var(--text-muted)]">Admin Panel</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Logout */}
                <div className="absolute bottom-4 left-4 right-4">
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors w-full">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 overflow-auto">
                {children}
            </main>
        </div>
    )
}
