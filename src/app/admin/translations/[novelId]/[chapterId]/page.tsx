"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Chapter {
    id: string;
    chapterNumber: number;
    title: string;
    contentOriginal: string | null;
    contentTranslated: string;
    wordCount: number;
    isPublished: boolean;
    novel: {
        id: string;
        title: string;
        slug: string;
    };
}

export default function ChapterEditorPage({
    params,
}: {
    params: { novelId: string; chapterId: string };
}) {
    const router = useRouter();
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [translatedContent, setTranslatedContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchChapter();
    }, [params.chapterId]);

    const fetchChapter = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/chapters/${params.chapterId}`);
            const data = await res.json();

            if (data.success) {
                setChapter(data.chapter);
                setTranslatedContent(data.chapter.contentTranslated || "");
            }
        } catch (error) {
            console.error("Error fetching chapter:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyEnglish = () => {
        if (chapter?.contentOriginal) {
            navigator.clipboard.writeText(chapter.contentOriginal);
            alert("English content copied to clipboard!");
        }
    };

    const handleSaveAndPublish = async () => {
        if (!translatedContent.trim()) {
            alert("Please add Indonesian translation before publishing");
            return;
        }

        if (
            !confirm(
                "This will publish the chapter immediately. Continue?"
            )
        ) {
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/chapters/${params.chapterId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contentTranslated: translatedContent,
                    isPublished: true,
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert("Chapter published successfully!");
                router.push(`/admin/translations/${params.novelId}`);
            } else {
                alert("Failed to publish: " + data.error);
            }
        } catch (error) {
            console.error("Error saving chapter:", error);
            alert("Error saving chapter");
        } finally {
            setSaving(false);
        }
    };

    const wordCount = translatedContent.trim().split(/\s+/).filter(Boolean).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading editor...</p>
                </div>
            </div>
        );
    }

    if (!chapter) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Chapter Not Found
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
                    href={`/admin/translations/${params.novelId}`}
                    className="inline-flex items-center text-blue-600 hover:underline mb-4"
                >
                    ← Back to Chapters
                </Link>

                {/* Editor Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                {chapter.novel.title}
                            </h1>
                            <p className="text-lg text-gray-700">
                                Chapter {chapter.chapterNumber}: {chapter.title}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500 mb-1">Word Count</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {wordCount.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side-by-Side Editor */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                        {/* Left Panel: English Original */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Original (English)
                                </h3>
                                <button
                                    onClick={handleCopyEnglish}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    📋 Copy English
                                </button>
                            </div>
                            <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded border border-gray-200 min-h-[600px] overflow-y-auto">
                                {chapter.contentOriginal ? (
                                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                        {chapter.contentOriginal}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 italic">
                                        No original content available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Indonesian Translation */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Translation (Indonesian)
                                </h3>
                                <div className="text-sm text-gray-500">
                                    {translatedContent.trim() ? "Editing..." : "Empty"}
                                </div>
                            </div>
                            <textarea
                                value={translatedContent}
                                onChange={(e) => setTranslatedContent(e.target.value)}
                                placeholder="Paste Indonesian translation here from Gemini..."
                                className="w-full min-h-[600px] p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed resize-none"
                                style={{ fontFamily: "ui-monospace, monospace" }}
                            />
                            <div className="mt-2 text-xs text-gray-500">
                                💡 Tip: Copy the English content → Translate with Gemini → Paste
                                here
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={() => router.push(`/admin/translations/${params.novelId}`)}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveAndPublish}
                        disabled={saving || !translatedContent.trim()}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>💾 Save & Publish</>
                        )}
                    </button>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📚 Translation Workflow:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                        <li>Click "Copy English" button to copy the original content</li>
                        <li>Open Gemini and paste the English text</li>
                        <li>Ask Gemini to translate to Indonesian (natural, literary style)</li>
                        <li>Copy the Indonesian translation from Gemini</li>
                        <li>Paste it into the right panel (Translation textarea)</li>
                        <li>Click "Save & Publish" to make it live immediately</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
