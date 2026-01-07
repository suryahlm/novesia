"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Eye, Edit, Plus, BookOpen } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { getProxiedImageUrl } from "@/lib/image-utils"
import DeleteChapterButton from "@/components/admin/DeleteChapterButton"

interface Chapter {
    id: string
    chapterNumber: number
    title: string
    wordCount: number
    views: number
    isPremium: boolean
}

interface Novel {
    id: string
    slug: string
    title: string
    cover: string | null
    chapters: Chapter[]
}

interface Props {
    novels: Novel[]
}

export default function NovelChapterAccordion({ novels }: Props) {
    const [expandedNovel, setExpandedNovel] = useState<string | null>(null)

    const toggleNovel = (novelId: string) => {
        setExpandedNovel(prev => prev === novelId ? null : novelId)
    }

    return (
        <div className="space-y-2">
            {novels.map((novel) => (
                <div key={novel.id} className="card overflow-hidden">
                    {/* Novel Header - always visible */}
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                        onClick={() => toggleNovel(novel.id)}
                    >
                        <div className="flex items-center gap-3">
                            {/* Expand/Collapse Arrow */}
                            <button
                                className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleNovel(novel.id)
                                }}
                            >
                                {expandedNovel === novel.id ? (
                                    <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                                )}
                            </button>

                            {/* Cover */}
                            {novel.cover ? (
                                <img
                                    src={getProxiedImageUrl(novel.cover) || novel.cover}
                                    alt={novel.title}
                                    className="w-10 h-14 object-cover rounded"
                                />
                            ) : (
                                <div className="w-10 h-14 bg-[var(--bg-tertiary)] rounded flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-[var(--text-muted)]" />
                                </div>
                            )}

                            {/* Title & Chapter Count */}
                            <div>
                                <Link
                                    href={`/novel/${novel.slug}`}
                                    className="font-semibold hover:text-[var(--color-primary)]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {novel.title}
                                </Link>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {novel.chapters.length} chapter
                                </p>
                            </div>
                        </div>

                        {/* Add Chapter Button */}
                        <Link
                            href={`/admin/novels/${novel.id}/chapters/new`}
                            className="btn btn-primary text-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Tambah Chapter
                        </Link>
                    </div>

                    {/* Chapters List - collapsed by default */}
                    {expandedNovel === novel.id && (
                        <div className="border-t border-[var(--bg-tertiary)]">
                            {novel.chapters.length === 0 ? (
                                <div className="p-6 text-center text-[var(--text-muted)]">
                                    <p>Belum ada chapter. Klik "Tambah Chapter" untuk mulai menulis.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[var(--bg-tertiary)] max-h-96 overflow-y-auto">
                                    {novel.chapters.map((chapter) => (
                                        <div
                                            key={chapter.id}
                                            className="flex items-center justify-between p-4 hover:bg-[var(--bg-secondary)] transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    Chapter {chapter.chapterNumber}: {chapter.title}
                                                </p>
                                                <p className="text-sm text-[var(--text-muted)]">
                                                    {chapter.wordCount} kata • {formatNumber(chapter.views)} views
                                                    {chapter.isPremium && (
                                                        <span className="ml-2 badge badge-premium text-xs">Premium</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/novel/${novel.slug}/${chapter.chapterNumber}`}
                                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                    title="Lihat"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/chapters/${chapter.id}/edit`}
                                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <DeleteChapterButton
                                                    chapterId={chapter.id}
                                                    chapterTitle={`Chapter ${chapter.chapterNumber}: ${chapter.title}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
