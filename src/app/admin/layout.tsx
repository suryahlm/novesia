import Link from "next/link"
import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Users,
    Settings,
    Download,
    BarChart3,
    ChevronLeft,
    ShieldAlert,
} from "lucide-react"
import { LogoutButton } from "@/components/admin/LogoutButton"

const sidebarItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/novels", icon: BookOpen, label: "Novel" },
    { href: "/admin/chapters", icon: FileText, label: "Chapter" },
    { href: "/admin/scraper", icon: Download, label: "Scraper" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
    // Check authentication
    const session = await auth()

    // Redirect to login if not authenticated
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/admin")
    }

    // Check if user is admin from database
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, name: true, email: true },
    })

    // Redirect if not admin
    if (!user || user.role !== "ADMIN") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md p-8">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
                    <p className="text-[var(--text-muted)] mb-6">
                        Anda tidak memiliki izin untuk mengakses halaman admin.
                        Halaman ini hanya untuk administrator.
                    </p>
                    <Link href="/" className="btn btn-primary">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--bg-tertiary)] hidden lg:flex lg:flex-col sticky top-0 h-screen">
                <div className="p-4 border-b border-[var(--bg-tertiary)]">
                    <Link href="/" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm">Kembali ke Website</span>
                    </Link>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 flex items-center justify-center text-white font-bold">
                            {user.name?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div>
                            <p className="font-semibold">{user.name || "Admin"}</p>
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

                {/* Logout - always at bottom */}
                <div className="p-4 border-t border-[var(--bg-tertiary)]">
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 overflow-auto">
                {children}
            </main>
        </div>
    )
}
