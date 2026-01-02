"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

interface DeleteNovelButtonProps {
    novelId: string
    novelTitle: string
}

export default function DeleteNovelButton({ novelId, novelTitle }: DeleteNovelButtonProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Hapus novel "${novelTitle}"? Semua chapter juga akan terhapus.`)) {
            return
        }

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/novels/${novelId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete")
            }

            router.refresh()
        } catch (error) {
            console.error("Error deleting novel:", error)
            alert("Gagal menghapus novel")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors disabled:opacity-50"
            title="Hapus"
        >
            {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </button>
    )
}
