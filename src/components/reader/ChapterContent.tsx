"use client"

import { useReaderStyles } from "./ReaderWrapper"

interface ChapterContentProps {
    chapterNumber: number
    title: string
    content: string
}

export default function ChapterContent({ chapterNumber, title, content }: ChapterContentProps) {
    const styles = useReaderStyles()

    return (
        <article
            className="max-w-3xl mx-auto px-4 py-8 transition-all duration-300"
            style={{
                backgroundColor: styles.backgroundColor,
                color: styles.color,
            }}
        >
            <h1
                className="text-xl sm:text-2xl font-bold mb-6 text-center"
                style={{ color: styles.color }}
            >
                Chapter {chapterNumber}: {title}
            </h1>

            <div
                className="prose max-w-none leading-relaxed transition-all duration-300"
                style={{
                    fontSize: `${styles.fontSize}px`,
                    fontFamily: styles.fontFamily,
                    lineHeight: styles.lineHeight,
                    color: styles.color,
                }}
            >
                {content.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                        <p key={index} className="mb-4">
                            {paragraph}
                        </p>
                    )
                ))}
            </div>
        </article>
    )
}
