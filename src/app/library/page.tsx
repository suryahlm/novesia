"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Library, BookOpen, LogIn } from "lucide-react"

export default function LibraryPage() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="text-center">
                    <Library className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Pustaka Kamu</h1>
                    <p className="text-[var(--text-muted)] mb-6">
                        Masuk untuk melihat koleksi novel kamu
                    </p>
                    <Link href="/login" className="btn btn-primary">
                        <LogIn className="w-4 h-4 mr-2" />
                        Masuk
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Pustaka Saya</h1>
                    <p className="text-[var(--text-muted)]">
                        Koleksi novel dan riwayat baca kamu
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-[var(--bg-tertiary)]">
                    <button className="pb-3 font-medium text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]">
                        Riwayat Baca
                    </button>
                    <button className="pb-3 font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        Bookmark
                    </button>
                    <button className="pb-3 font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        Koleksi
                    </button>
                </div>

                {/* Empty State */}
                <div className="card p-12 text-center">
                    <BookOpen className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Belum ada riwayat baca</h3>
                    <p className="text-[var(--text-muted)] mb-6">
                        Mulai membaca novel untuk melihat riwayat di sini
                    </p>
                    <Link href="/discover" className="btn btn-primary">
                        Jelajahi Novel
                    </Link>
                </div>
            </div>
        </div>
    )
}
