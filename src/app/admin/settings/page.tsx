"use client"

import { useState, useEffect, useRef } from "react"
import { Settings, Save, Globe, Bell, Shield, Palette, RefreshCw, Loader2, CheckCircle, Image, Upload, X } from "lucide-react"

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [uploading, setUploading] = useState<string | null>(null)
    const [branding, setBranding] = useState({
        logoUrl: "",
        faviconUrl: "",
        ogImageUrl: "",
    })
    const [settings, setSettings] = useState({
        siteName: "Novesia",
        siteDescription: "Platform novel terbaik Indonesia",
        maintenanceMode: false,
        registrationEnabled: true,
        requireEmailVerification: false,
        defaultUserCoins: 50,
        vipMonthlyPrice: 49000,
        vipQuarterlyPrice: 120000,
        vipYearlyPrice: 399000,
        donationLink: "https://saweria.co/novesia",
        coinPurchaseEnabled: true,
        googleLoginEnabled: true,
        maxUploadSize: 5,
        scraperEnabled: true,
        translationEnabled: true,
    })

    useEffect(() => {
        async function loadSettings() {
            try {
                // Load settings
                const response = await fetch("/api/settings")
                if (response.ok) {
                    const data = await response.json()
                    setSettings(data)
                }

                // Load branding
                const brandingResponse = await fetch("/api/admin/branding")
                if (brandingResponse.ok) {
                    const brandingData = await brandingResponse.json()
                    setBranding(brandingData)
                }
            } catch (error) {
                console.error("Error loading settings:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        setSaveSuccess(false)
        try {
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            })
            if (response.ok) {
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
            } else {
                alert("Gagal menyimpan pengaturan")
            }
        } catch (error) {
            console.error("Error saving settings:", error)
            alert("Terjadi kesalahan")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUploadBranding = async (file: File, type: "logo" | "favicon" | "ogImage") => {
        setUploading(type)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("type", type)

            const response = await fetch("/api/admin/branding", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (response.ok) {
                setBranding(prev => ({
                    ...prev,
                    [`${type}Url`]: data.url
                }))
                alert(`${type === "logo" ? "Logo" : type === "favicon" ? "Favicon" : "OG Image"} berhasil diupload!`)
            } else {
                alert(data.error || "Gagal upload")
            }
        } catch (error) {
            console.error("Error uploading:", error)
            alert("Terjadi kesalahan saat upload")
        } finally {
            setUploading(null)
        }
    }

    if (isLoading) {
        return (
            <div className="py-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        )
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
                    className={`btn ${saveSuccess ? "bg-green-500 hover:bg-green-600" : "btn-primary"}`}
                >
                    {isSaving ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : saveSuccess ? (
                        <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Tersimpan!
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Simpan
                        </>
                    )}
                </button>
            </div>

            <div className="grid gap-6">
                {/* Branding */}
                <div className="card p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Image className="w-5 h-5 text-[var(--color-primary)]" />
                        Branding
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Logo Navbar */}
                        <div className="text-center">
                            <label className="block text-sm font-medium mb-2">Logo Navbar</label>
                            <p className="text-xs text-[var(--text-muted)] mb-2">48x48px, PNG/SVG</p>
                            <div className="border-2 border-dashed border-[var(--bg-tertiary)] rounded-lg p-4 text-center min-h-[140px] flex flex-col items-center justify-center">
                                <div className="h-12 flex items-center justify-center mb-2">
                                    {branding.logoUrl ? (
                                        <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                                    ) : (
                                        <Image className="w-12 h-12 text-[var(--text-muted)]" />
                                    )}
                                </div>
                                {branding.logoUrl && <p className="text-xs text-green-500 mb-2">Logo aktif</p>}
                                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:opacity-90">
                                    {uploading === "logo" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    Upload
                                    <input
                                        type="file"
                                        accept="image/png,image/svg+xml,image/webp"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleUploadBranding(file, "logo")
                                        }}
                                        disabled={uploading !== null}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Favicon */}
                        <div className="text-center">
                            <label className="block text-sm font-medium mb-2">Favicon</label>
                            <p className="text-xs text-[var(--text-muted)] mb-2">32x32px, ICO/PNG</p>
                            <div className="border-2 border-dashed border-[var(--bg-tertiary)] rounded-lg p-4 text-center min-h-[140px] flex flex-col items-center justify-center">
                                <div className="h-12 flex items-center justify-center mb-2">
                                    {branding.faviconUrl ? (
                                        <img src={branding.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                                    ) : (
                                        <Image className="w-12 h-12 text-[var(--text-muted)]" />
                                    )}
                                </div>
                                {branding.faviconUrl && <p className="text-xs text-green-500 mb-2">Favicon aktif</p>}
                                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:opacity-90">
                                    {uploading === "favicon" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    Upload
                                    <input
                                        type="file"
                                        accept="image/x-icon,image/png"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleUploadBranding(file, "favicon")
                                        }}
                                        disabled={uploading !== null}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* OG Image */}
                        <div className="text-center">
                            <label className="block text-sm font-medium mb-2">OG Image</label>
                            <p className="text-xs text-[var(--text-muted)] mb-2">1200x630px, PNG/JPG</p>
                            <div className="border-2 border-dashed border-[var(--bg-tertiary)] rounded-lg p-4 text-center min-h-[140px] flex flex-col items-center justify-center">
                                <div className="h-12 flex items-center justify-center mb-2">
                                    {branding.ogImageUrl ? (
                                        <img src={branding.ogImageUrl} alt="OG Image" className="h-12 w-auto object-cover rounded" />
                                    ) : (
                                        <Image className="w-12 h-12 text-[var(--text-muted)]" />
                                    )}
                                </div>
                                {branding.ogImageUrl && <p className="text-xs text-green-500 mb-2">OG Image aktif</p>}
                                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:opacity-90">
                                    {uploading === "ogImage" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    Upload
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleUploadBranding(file, "ogImage")
                                        }}
                                        disabled={uploading !== null}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

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
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">VIP Bulanan (Rp)</label>
                                <input
                                    type="number"
                                    value={settings.vipMonthlyPrice}
                                    onChange={(e) => setSettings({ ...settings, vipMonthlyPrice: parseInt(e.target.value) })}
                                    className="input w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">VIP 3 Bulan (Rp)</label>
                                <input
                                    type="number"
                                    value={settings.vipQuarterlyPrice}
                                    onChange={(e) => setSettings({ ...settings, vipQuarterlyPrice: parseInt(e.target.value) })}
                                    className="input w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">VIP Tahunan (Rp)</label>
                                <input
                                    type="number"
                                    value={settings.vipYearlyPrice}
                                    onChange={(e) => setSettings({ ...settings, vipYearlyPrice: parseInt(e.target.value) })}
                                    className="input w-full"
                                />
                            </div>
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
                        <div>
                            <label className="block text-sm font-medium mb-2">Link Donasi (Saweria/Trakteer)</label>
                            <p className="text-xs text-[var(--text-muted)] mb-2">Contoh: https://saweria.co/username</p>
                            <input
                                type="url"
                                value={settings.donationLink}
                                onChange={(e) => setSettings({ ...settings, donationLink: e.target.value })}
                                placeholder="https://saweria.co/username"
                                className="input w-full"
                            />
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
