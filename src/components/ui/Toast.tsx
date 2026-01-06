"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    showToast: (message: string, type?: ToastType, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
}

const styles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-amber-500 text-white",
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const Icon = icons[toast.type]

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-up",
                styles[toast.type]
            )}
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={onRemove}
                className="p-1 hover:bg-white/20 rounded transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const showToast = useCallback(
        (message: string, type: ToastType = "info", duration: number = 4000) => {
            const id = Math.random().toString(36).substring(2, 9)
            const toast: Toast = { id, message, type, duration }

            setToasts((prev) => [...prev, toast])

            if (duration > 0) {
                setTimeout(() => removeToast(id), duration)
            }
        },
        [removeToast]
    )

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-80 z-50 space-y-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
