"use client"

import Link from "next/link"
import { PlayCircle, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

interface ContinueReadingButtonProps {
    novelSlug: string
    firstChapterNumber: number
}

export default function ContinueReadingButton({ novelSlug, firstChapterNumber }: ContinueReadingButtonProps) {
    const { data: session, status } = useSession()
    const [lastReadChapter, setLastReadChapter] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "loading") return

        if (session?.user?.id) {
            fetch(`/api/user/history?novelSlug=${novelSlug}`)
                .then(res => res.json())
                .then(data => {
                    if (data.lastReadChapter) {
                        setLastReadChapter(data.lastReadChapter)
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [session?.user?.id, status, novelSlug])

    // Don't show if not logged in or no reading history
    if (!session || loading) {
        return null
    }

    // Show "Lanjut Baca" if user has reading history and it's not chapter 1
    if (lastReadChapter && lastReadChapter > firstChapterNumber) {
        return (
            <Link
                href={`/novel/${novelSlug}/${lastReadChapter}`}
                className="btn btn-primary"
            >
                <PlayCircle className="w-4 h-4 mr-2" />
                Lanjut Ch.{lastReadChapter}
            </Link>
        )
    }

    return null
}
