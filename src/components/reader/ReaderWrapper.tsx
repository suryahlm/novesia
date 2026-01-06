"use client"

import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import ReaderSettingsPanel, { useReaderSettings, type ReaderTheme, type FontFamily } from "./ReaderSettings"

interface ReaderWrapperProps {
    children: React.ReactNode
}

const fonts = {
    sans: "Inter, system-ui, sans-serif",
    serif: "Merriweather, Georgia, serif",
    mono: "JetBrains Mono, monospace",
}

const themes = {
    light: { bg: "#ffffff", text: "#1e293b" },
    sepia: { bg: "#f5f0e6", text: "#5c4b37" },
    dark: { bg: "#1a1a2e", text: "#e2e8f0" },
}

export default function ReaderWrapper({ children }: ReaderWrapperProps) {
    const { settings, setSettings } = useReaderSettings()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Apply reader styles as inline CSS variables
    const readerStyle = mounted ? {
        "--reader-font-size": `${settings.fontSize}px`,
        "--reader-font-family": fonts[settings.fontFamily as FontFamily],
        "--reader-line-height": settings.lineHeight,
        "--reader-bg": themes[settings.theme as ReaderTheme].bg,
        "--reader-text": themes[settings.theme as ReaderTheme].text,
    } as React.CSSProperties : {}

    return (
        <div style={readerStyle}>
            {/* Settings Button - Fixed at bottom right */}
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="fixed bottom-24 md:bottom-8 right-4 z-40 p-3 bg-[var(--color-primary)] text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                aria-label="Reader Settings"
            >
                <Settings className="w-5 h-5" />
            </button>

            {/* Settings Panel */}
            <ReaderSettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />

            {children}
        </div>
    )
}

// Export custom hook to access styles in child components
export function useReaderStyles() {
    const { settings } = useReaderSettings()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return {
            fontSize: 18,
            fontFamily: fonts.serif,
            lineHeight: 1.8,
            backgroundColor: themes.light.bg,
            color: themes.light.text,
        }
    }

    return {
        fontSize: settings.fontSize,
        fontFamily: fonts[settings.fontFamily as FontFamily],
        lineHeight: settings.lineHeight,
        backgroundColor: themes[settings.theme as ReaderTheme].bg,
        color: themes[settings.theme as ReaderTheme].text,
    }
}
