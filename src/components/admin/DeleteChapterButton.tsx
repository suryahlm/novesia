"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

interface DeleteChapterButtonProps {
    chapterId: string
    chapterTitle: string
}

export default function DeleteChapterButton({ chapterId, chapterTitle }: DeleteChapterButtonProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Hapus chapter "${chapterTitle}"?`)) {
            return
        }

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/chapters/${chapterId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete")
            }

            router.refresh()
        } catch (error) {
            console.error("Error deleting chapter:", error)
            alert("Gagal menghapus chapter")
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
