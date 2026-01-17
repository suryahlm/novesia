"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Novel {
    id: string;
    title: string;
    slug: string;
    cover: string | null;
    status: string;
    _count: {
        draftChapters: number;
        publishedChapters: number;
        totalChapters: number;
    };
    latestDraft: {
        chapterNumber: number;
        createdAt: string;
    } | null;
    genres: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
}

export default function TranslationsPage() {
    const router = useRouter();
    const [novels, setNovels] = useState<Novel[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("drafts");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchNovels();
    }, [filter, sort, search]);

    const fetchNovels = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter) params.append("filter", filter);
            if (sort) params.append("sort", sort);
            if (search) params.append("search", search);

            const res = await fetch(`/api/admin/novels/pending?${params}`);
            const data = await res.json();

            if (data.success) {
                setNovels(data.novels);
            }
        } catch (error) {
            console.error("Error fetching novels:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Translation Management
                    </h1>
                    <p className="text-gray-600">
                        Manage draft chapters and publish translated content
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search Novel
                            </label>
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Filter by Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Novel Status
                            </label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All</option>
                                <option value="complete">Complete</option>
                                <option value="ongoing">Ongoing</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort By
                            </label>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="drafts">Most Drafts</option>
                                <option value="latest">Latest Scrape</option>
                                <option value="title">Title A-Z</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading novels...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && novels.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Draft Chapters Found
                        </h3>
                        <p className="text-gray-600">
                            All chapters are published or no novels have been scraped yet.
                        </p>
                    </div>
                )}

                {/* Novels Grid */}
                {!loading && novels.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {novels.map((novel) => (
                            <div
                                key={novel.id}
                                onClick={() => router.push(`/admin/translations/${novel.id}`)}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                            >
                                {/* Cover Image */}
                                <div className="relative h-48 bg-gray-200">
                                    {novel.cover ? (
                                        <Image
                                            src={novel.cover}
                                            alt={novel.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <span className="text-5xl">📖</span>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded ${novel.status === "COMPLETED"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-blue-100 text-blue-800"
                                                }`}
                                        >
                                            {novel.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                                        {novel.title}
                                    </h3>

                                    {/* Genres */}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {novel.genres.slice(0, 3).map((genre) => (
                                            <span
                                                key={genre.id}
                                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Stats */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Draft Chapters:</span>
                                            <span className="font-semibold text-red-600">
                                                {novel._count.draftChapters}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Published:</span>
                                            <span className="font-semibold text-green-600">
                                                {novel._count.publishedChapters}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total:</span>
                                            <span className="font-semibold text-gray-900">
                                                {novel._count.totalChapters}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Latest Draft Info */}
                                    {novel.latestDraft && (
                                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                            Latest: Chapter {novel.latestDraft.chapterNumber} •{" "}
                                            {new Date(novel.latestDraft.createdAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
