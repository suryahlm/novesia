"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Chapter {
    id: string;
    chapterNumber: number;
    title: string;
    wordCount: number;
    isPublished: boolean;
    createdAt: string;
}

interface Novel {
    id: string;
    title: string;
    slug: string;
    cover: string | null;
    synopsis: string;
    status: string;
    author: string | null;
}

export default function NovelChaptersPage({
    params,
}: {
    params: { novelId: string };
}) {
    const router = useRouter();
    const [novel, setNovel] = useState<Novel | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"drafts" | "published">("drafts");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [params.novelId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch chapters with novel info
            const res = await fetch(
                `/api/admin/chapters/drafts?novelId=${params.novelId}&status=all`
            );
            const data = await res.json();

            if (data.success && data.chapters.length > 0) {
                setNovel(data.chapters[0].novel);
                setChapters(data.chapters);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (chapterId: string) => {
        if (!confirm("Are you sure you want to delete this draft chapter?")) {
            return;
        }

        setDeletingId(chapterId);
        try {
            const res = await fetch(`/api/admin/chapters/${chapterId}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                // Refresh chapters
                fetchData();
            } else {
                alert("Failed to delete chapter: " + data.error);
            }
        } catch (error) {
            console.error("Error deleting chapter:", error);
            alert("Error deleting chapter");
        } finally {
            setDeletingId(null);
        }
    };

    const filteredChapters = chapters.filter((ch) =>
        activeTab === "drafts" ? !ch.isPublished : ch.isPublished
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!novel) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Novel Not Found
                        </h3>
                        <Link
                            href="/admin/translations"
                            className="text-blue-600 hover:underline"
                        >
                            ← Back to Translations
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/admin/translations"
                    className="inline-flex items-center text-blue-600 hover:underline mb-4"
                >
                    ← Back to Translations
                </Link>

                {/* Novel Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex gap-6">
                        {/* Cover */}
                        <div className="flex-shrink-0">
                            <div className="relative w-32 h-48 bg-gray-200 rounded-lg overflow-hidden">
                                {novel.cover ? (
                                    <Image
                                        src={novel.cover}
                                        alt={novel.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <span className="text-4xl">📖</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {novel.title}
                            </h1>
                            {novel.author && (
                                <p className="text-gray-600 mb-2">By {novel.author}</p>
                            )}
                            <div className="mb-3">
                                <span
                                    className={`px-3 py-1 text-sm font-semibold rounded ${novel.status === "COMPLETED"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                                >
                                    {novel.status}
                                </span>
                            </div>
                            <p className="text-gray-700 line-clamp-3">{novel.synopsis}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab("drafts")}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "drafts"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Draft Chapters ({chapters.filter((ch) => !ch.isPublished).length})
                            </button>
                            <button
                                onClick={() => setActiveTab("published")}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "published"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Published ({chapters.filter((ch) => ch.isPublished).length})
                            </button>
                        </div>
                    </div>

                    {/* Chapter Table */}
                    <div className="p-6">
                        {filteredChapters.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No {activeTab} chapters found
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                                #
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                                Title
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                                Words
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                                Date
                                            </th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredChapters.map((chapter) => (
                                            <tr
                                                key={chapter.id}
                                                className="border-b border-gray-100 hover:bg-gray-50"
                                            >
                                                <td className="py-3 px-4 text-gray-900">
                                                    {chapter.chapterNumber}
                                                </td>
                                                <td className="py-3 px-4 text-gray-900">
                                                    {chapter.title}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {chapter.wordCount.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded ${chapter.isPublished
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                    >
                                                        {chapter.isPublished ? "Published" : "Draft"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 text-sm">
                                                    {new Date(chapter.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {!chapter.isPublished && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        router.push(
                                                                            `/admin/translations/${novel.id}/${chapter.id}`
                                                                        )
                                                                    }
                                                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                                                >
                                                                    ✏️ Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(chapter.id)}
                                                                    disabled={deletingId === chapter.id}
                                                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    {deletingId === chapter.id ? "..." : "🗑️ Delete"}
                                                                </button>
                                                            </>
                                                        )}
                                                        {chapter.isPublished && (
                                                            <Link
                                                                href={`/novels/${novel.slug}`}
                                                                target="_blank"
                                                                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                                            >
                                                                👁️ View
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
