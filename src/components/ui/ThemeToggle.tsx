"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Check localStorage or system preference
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme === "dark") {
            setIsDark(true)
            document.documentElement.classList.add("dark")
        } else if (savedTheme === "light") {
            setIsDark(false)
            document.documentElement.classList.remove("dark")
        } else {
            // Use system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
            setIsDark(prefersDark)
            if (prefersDark) {
                document.documentElement.classList.add("dark")
            }
        }
    }, [])

    const toggleTheme = () => {
        const newIsDark = !isDark
        setIsDark(newIsDark)

        if (newIsDark) {
            document.documentElement.classList.add("dark")
            localStorage.setItem("theme", "dark")
        } else {
            document.documentElement.classList.remove("dark")
            localStorage.setItem("theme", "light")
        }
    }

    // Avoid hydration mismatch
    if (!mounted) {
        return (
            <button
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                aria-label="Toggle theme"
            >
                <div className="w-5 h-5" />
            </button>
        )
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? (
                <Sun className="w-5 h-5 text-amber-500" />
            ) : (
                <Moon className="w-5 h-5 text-slate-600" />
            )}
        </button>
    )
}
