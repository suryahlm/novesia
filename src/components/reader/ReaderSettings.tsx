"use client"

import { useState, useEffect } from "react"
import {
    X,
    Type,
    Palette,
    Sun,
    Moon,
    BookOpen,
    Minus,
    Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ReaderTheme = "light" | "sepia" | "dark"
export type FontFamily = "sans" | "serif" | "mono"

interface ReaderSettings {
    theme: ReaderTheme
    fontSize: number
    fontFamily: FontFamily
    lineHeight: number
}

interface ReaderSettingsProps {
    isOpen: boolean
    onClose: () => void
    settings: ReaderSettings
    onSettingsChange: (settings: ReaderSettings) => void
    locale?: "id" | "en"
}

const FONT_SIZE_MIN = 14
const FONT_SIZE_MAX = 28
const FONT_SIZE_STEP = 2

const themes = [
    { id: "light" as const, icon: Sun, label: { id: "Terang", en: "Light" }, bg: "#ffffff", text: "#1e293b" },
    { id: "sepia" as const, icon: BookOpen, label: { id: "Sepia", en: "Sepia" }, bg: "#f5f0e6", text: "#5c4b37" },
    { id: "dark" as const, icon: Moon, label: { id: "Gelap", en: "Dark" }, bg: "#1a1a2e", text: "#e2e8f0" },
]

const fonts = [
    { id: "sans" as const, label: "Sans", family: "Inter, system-ui, sans-serif" },
    { id: "serif" as const, label: "Serif", family: "Merriweather, Georgia, serif" },
    { id: "mono" as const, label: "Mono", family: "JetBrains Mono, monospace" },
]

const lineHeights = [
    { value: 1.5, label: { id: "Rapat", en: "Compact" } },
    { value: 1.8, label: { id: "Normal", en: "Normal" } },
    { value: 2.2, label: { id: "Lebar", en: "Relaxed" } },
]

export default function ReaderSettingsPanel({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
    locale = "id",
}: ReaderSettingsProps) {
    const t = (key: { id: string; en: string }) => key[locale]

    const updateSetting = <K extends keyof ReaderSettings>(
        key: K,
        value: ReaderSettings[K]
    ) => {
        const newSettings = { ...settings, [key]: value }
        onSettingsChange(newSettings)
        // Persist to localStorage
        localStorage.setItem("reader-settings", JSON.stringify(newSettings))
    }

    const increaseFontSize = () => {
        if (settings.fontSize < FONT_SIZE_MAX) {
            updateSetting("fontSize", settings.fontSize + FONT_SIZE_STEP)
        }
    }

    const decreaseFontSize = () => {
        if (settings.fontSize > FONT_SIZE_MIN) {
            updateSetting("fontSize", settings.fontSize - FONT_SIZE_STEP)
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="absolute bottom-0 left-0 right-0 bg-[var(--bg-primary)] rounded-t-2xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">
                        {t({ id: "Pengaturan Baca", en: "Reader Settings" })}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Theme Selection */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm font-medium">
                            {t({ id: "Tema", en: "Theme" })}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => updateSetting("theme", theme.id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                    settings.theme === theme.id
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                                        : "border-transparent bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)]"
                                )}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: theme.bg, color: theme.text }}
                                >
                                    <theme.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium">{t(theme.label)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Font Size */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Type className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm font-medium">
                            {t({ id: "Ukuran Font", en: "Font Size" })}
                        </span>
                    </div>
                    <div className="flex items-center justify-between bg-[var(--bg-tertiary)] rounded-xl p-2">
                        <button
                            onClick={decreaseFontSize}
                            disabled={settings.fontSize <= FONT_SIZE_MIN}
                            className={cn(
                                "p-3 rounded-lg transition-colors",
                                settings.fontSize <= FONT_SIZE_MIN
                                    ? "text-[var(--text-muted)] cursor-not-allowed"
                                    : "hover:bg-[var(--bg-secondary)]"
                            )}
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold">{settings.fontSize}</span>
                            <span className="text-xs text-[var(--text-muted)]">px</span>
                        </div>
                        <button
                            onClick={increaseFontSize}
                            disabled={settings.fontSize >= FONT_SIZE_MAX}
                            className={cn(
                                "p-3 rounded-lg transition-colors",
                                settings.fontSize >= FONT_SIZE_MAX
                                    ? "text-[var(--text-muted)] cursor-not-allowed"
                                    : "hover:bg-[var(--bg-secondary)]"
                            )}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    {/* Font Size Preview Bar */}
                    <div className="mt-2 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--color-primary)] transition-all"
                            style={{
                                width: `${((settings.fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Font Family */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Type className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm font-medium">
                            {t({ id: "Jenis Font", en: "Font Family" })}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {fonts.map((font) => (
                            <button
                                key={font.id}
                                onClick={() => updateSetting("fontFamily", font.id)}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all text-center",
                                    settings.fontFamily === font.id
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                                        : "border-transparent bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)]"
                                )}
                                style={{ fontFamily: font.family }}
                            >
                                <span className="text-lg">Aa</span>
                                <span className="block text-xs mt-1 font-sans">{font.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Line Height */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Type className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm font-medium">
                            {t({ id: "Jarak Baris", en: "Line Height" })}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {lineHeights.map((lh) => (
                            <button
                                key={lh.value}
                                onClick={() => updateSetting("lineHeight", lh.value)}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all",
                                    settings.lineHeight === lh.value
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                                        : "border-transparent bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)]"
                                )}
                            >
                                <div className="flex flex-col gap-0.5">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-0.5 bg-current rounded-full"
                                            style={{ marginTop: i > 1 ? `${(lh.value - 1) * 4}px` : 0 }}
                                        />
                                    ))}
                                </div>
                                <span className="block text-xs mt-2">{t(lh.label)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div className="mb-4">
                    <span className="text-sm font-medium text-[var(--text-muted)] mb-2 block">
                        {t({ id: "Pratinjau", en: "Preview" })}
                    </span>
                    <div
                        className={cn(
                            "p-4 rounded-xl",
                            settings.theme === "light" && "bg-white text-[#1e293b]",
                            settings.theme === "sepia" && "bg-[#f5f0e6] text-[#5c4b37]",
                            settings.theme === "dark" && "bg-[#1a1a2e] text-[#e2e8f0]"
                        )}
                        style={{
                            fontSize: `${settings.fontSize}px`,
                            fontFamily: fonts.find((f) => f.id === settings.fontFamily)?.family,
                            lineHeight: settings.lineHeight,
                        }}
                    >
                        {locale === "id"
                            ? "Aku berdiri di tepi jurang, menatap kekosongan yang membentang di bawahku. Angin malam berdesir lembut, membawa aroma hujan yang akan datang."
                            : "I stood at the edge of the cliff, gazing into the void that stretched beneath me. The night wind whispered softly, carrying the scent of coming rain."}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Hook to manage reader settings
export function useReaderSettings() {
    const [settings, setSettings] = useState<ReaderSettings>({
        theme: "light",
        fontSize: 18,
        fontFamily: "serif",
        lineHeight: 1.8,
    })

    useEffect(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem("reader-settings")
        if (saved) {
            try {
                setSettings(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse reader settings:", e)
            }
        }
    }, [])

    return { settings, setSettings }
}
