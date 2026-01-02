"use client"

import { useState } from "react"
import { Settings, Save, Globe, Bell, Shield, Palette, RefreshCw } from "lucide-react"

export default function AdminSettingsPage() {
    const [isSaving, setIsSaving] = useState(false)
    const [settings, setSettings] = useState({
        siteName: "Novesia",
        siteDescription: "Platform novel terbaik Indonesia",
        maintenanceMode: false,
        registrationEnabled: true,
        requireEmailVerification: false,
        defaultUserCoins: 50,
        vipMonthlyPrice: 49000,
        coinPurchaseEnabled: true,
        googleLoginEnabled: true,
        maxUploadSize: 5,
        scraperEnabled: true,
        translationEnabled: true,
    })

    const handleSave = async () => {
        setIsSaving(true)
        // TODO: Save settings to database
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsSaving(false)
        alert("Pengaturan berhasil disimpan!")
    }

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Pengaturan</h1>
                    <p className="text-[var(--text-secondary)]">
                        Konfigurasi platform Novesia
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-primary"
                >
                    {isSaving ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Simpan
                        </>
                    )}
                </button>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-[var(--color-primary)]" />
                        Pengaturan Umum
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Nama Situs</label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Deskripsi Situs</label>
                            <textarea
                                value={settings.siteDescription}
                                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                className="input h-24 resize-none"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Mode Maintenance</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Nonaktifkan akses publik sementara
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* User Settings */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[var(--color-primary)]" />
                        Pengaturan User
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Registrasi Terbuka</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Izinkan user baru untuk mendaftar
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.registrationEnabled}
                                    onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Login dengan Google</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Aktifkan opsi login via Google
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.googleLoginEnabled}
                                    onChange={(e) => setSettings({ ...settings, googleLoginEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Koin Awal User Baru</label>
                            <input
                                type="number"
                                value={settings.defaultUserCoins}
                                onChange={(e) => setSettings({ ...settings, defaultUserCoins: parseInt(e.target.value) })}
                                className="input w-32"
                            />
                        </div>
                    </div>
                </div>

                {/* Monetization Settings */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-[var(--color-primary)]" />
                        Monetisasi
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Harga VIP Bulanan (Rp)</label>
                            <input
                                type="number"
                                value={settings.vipMonthlyPrice}
                                onChange={(e) => setSettings({ ...settings, vipMonthlyPrice: parseInt(e.target.value) })}
                                className="input w-40"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Pembelian Koin</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Aktifkan fitur beli koin
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.coinPurchaseEnabled}
                                    onChange={(e) => setSettings({ ...settings, coinPurchaseEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Content Settings */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[var(--color-primary)]" />
                        Konten & Scraper
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Scraper Aktif</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Izinkan scraping novel dari sumber eksternal
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.scraperEnabled}
                                    onChange={(e) => setSettings({ ...settings, scraperEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Auto-Translate</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Terjemahkan otomatis konten yang di-scrape
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.translationEnabled}
                                    onChange={(e) => setSettings({ ...settings, translationEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Max Upload Size (MB)</label>
                            <input
                                type="number"
                                value={settings.maxUploadSize}
                                onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) })}
                                className="input w-32"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
