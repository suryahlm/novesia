"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function LogoutButton() {
    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" })
    }

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors w-full"
        >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
        </button>
    )
}
