import Link from "next/link"
import { prisma } from "@/lib/prisma"

async function getDonationLink() {
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: "donationLink" }
        })
        if (setting) {
            return JSON.parse(setting.value) as string
        }
    } catch (error) {
        console.error("Error fetching donation link:", error)
    }
    return "https://saweria.co/novesia"
}

export default async function Footer() {
    const donationLink = await getDonationLink()
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] mt-auto hidden md:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="font-bold text-xl">Novesia</span>
                        </Link>
                        <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm">
                            Platform baca novel web terbaik dengan pengalaman membaca yang imersif.
                            Ribuan novel terjemahan berkualitas dalam Bahasa Indonesia.
                        </p>
                        {/* Donate Button */}
                        <a
                            href={donationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M2 21v-2h18v2H2zm2-4v-1c0-1.1.9-2 2-2h1V7H5V3h14v4h-2v7h1c1.1 0 2 .9 2 2v1H4zm4-3h8V7H8v7z" />
                            </svg>
                            Traktir Kopi ☕
                        </a>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Navigasi</h3>
                        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                            <li><Link href="/" className="hover:text-[var(--color-primary)]">Beranda</Link></li>
                            <li><Link href="/discover" className="hover:text-[var(--color-primary)]">Jelajahi</Link></li>
                            <li><Link href="/genre" className="hover:text-[var(--color-primary)]">Genre</Link></li>
                            <li><Link href="/library" className="hover:text-[var(--color-primary)]">Pustaka</Link></li>
                        </ul>
                    </div>

                    {/* More Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Lainnya</h3>
                        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                            <li><Link href="/rewards" className="hover:text-[var(--color-primary)]">Hadiah</Link></li>
                            <li><Link href="/pricing" className="hover:text-[var(--color-primary)]">VIP</Link></li>
                            <li><Link href="/profile" className="hover:text-[var(--color-primary)]">Profil</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-[var(--bg-tertiary)] mt-8 pt-6 text-center text-sm text-[var(--text-muted)]">
                    <p>© {currentYear} Novesia. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
