"use client"

import { useState, useEffect } from "react"
import { Download, X, Smartphone, Monitor, Share, PlusSquare } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function InstallAppButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop")

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true)
            return
        }

        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase()
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform("ios")
        } else if (/android/.test(userAgent)) {
            setPlatform("android")
        } else {
            setPlatform("desktop")
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
        }

        const handleAppInstalled = () => {
            setIsInstalled(true)
            setShowModal(false)
        }

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
        window.addEventListener("appinstalled", handleAppInstalled)

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
            window.removeEventListener("appinstalled", handleAppInstalled)
        }
    }, [])

    const handleInstallClick = async () => {
        // If we have the prompt available, use it directly
        if (deferredPrompt) {
            await deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === "accepted") {
                setIsInstalled(true)
            }
            setDeferredPrompt(null)
        } else {
            // Show modal with instructions
            setShowModal(true)
        }
    }

    // Don't show if already installed
    if (isInstalled) {
        return null
    }

    return (
        <>
            {/* Install Button */}
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                title="Install Novesia App"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install</span>
            </button>

            {/* Install Instructions Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div
                        className="relative bg-[var(--bg-primary)] rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--bg-tertiary)]"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Download className="w-6 h-6 text-[var(--color-primary)]" />
                            Install Novesia
                        </h2>

                        {platform === "ios" ? (
                            <div className="space-y-4">
                                <p className="text-[var(--text-secondary)]">
                                    Untuk install di iPhone/iPad:
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">1</div>
                                        <div>
                                            <p className="font-medium">Tap tombol Share</p>
                                            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1">
                                                <Share className="w-4 h-4" /> (kotak dengan panah ke atas)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">2</div>
                                        <div>
                                            <p className="font-medium">Scroll ke bawah</p>
                                            <p className="text-sm text-[var(--text-muted)]">Cari opsi di bagian bawah menu</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">3</div>
                                        <div>
                                            <p className="font-medium flex items-center gap-1">
                                                <PlusSquare className="w-4 h-4" /> Add to Home Screen
                                            </p>
                                            <p className="text-sm text-[var(--text-muted)]">Tap untuk menambahkan ke layar utama</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : platform === "android" ? (
                            <div className="space-y-4">
                                <p className="text-[var(--text-secondary)]">
                                    Untuk install di Android:
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">1</div>
                                        <div>
                                            <p className="font-medium">Tap menu ⋮ (tiga titik)</p>
                                            <p className="text-sm text-[var(--text-muted)]">Di pojok kanan atas browser</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">2</div>
                                        <div>
                                            <p className="font-medium">Install app / Add to Home Screen</p>
                                            <p className="text-sm text-[var(--text-muted)]">Pilih opsi untuk menginstall</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-[var(--text-secondary)]">
                                    Untuk install di Desktop:
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">1</div>
                                        <div>
                                            <p className="font-medium">Klik menu ⋮ (tiga titik)</p>
                                            <p className="text-sm text-[var(--text-muted)]">Di pojok kanan atas browser</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">2</div>
                                        <div>
                                            <p className="font-medium">Save and Share → Install Novesia</p>
                                            <p className="text-sm text-[var(--text-muted)]">Atau cari icon 📥 di address bar</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setShowModal(false)}
                            className="mt-6 w-full btn btn-primary"
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
