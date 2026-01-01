import OpenAI from "openai"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export interface TranslationResult {
    success: boolean
    translatedText?: string
    error?: string
}

/**
 * Translate novel content from English/Chinese to Indonesian
 * Using gpt-4o-mini for cost-effective translation
 */
export async function translateContent(
    originalText: string,
    context?: {
        novelTitle?: string
        chapterNumber?: number
    }
): Promise<TranslationResult> {
    try {
        const systemPrompt = `Kamu adalah penerjemah novel profesional. Tugasmu adalah menerjemahkan teks novel ke Bahasa Indonesia dengan gaya berikut:
- Natural dan luwes, seperti novel yang ditulis langsung dalam Bahasa Indonesia
- Emosional dan mengalir, bukan kaku seperti terjemahan mesin
- Pertahankan nuansa asli, termasuk dialog karakter dan deskripsi suasana
- Jaga konsistensi nama karakter dan istilah khusus
- Gunakan kata ganti yang tepat (dia/ia untuk he/she, kamu/Anda sesuai konteks)
- Hindari terjemahan literal yang terdengar aneh

${context?.novelTitle ? `Novel: ${context.novelTitle}` : ""}
${context?.chapterNumber ? `Chapter: ${context.chapterNumber}` : ""}`

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Terjemahkan teks berikut ke Bahasa Indonesia:\n\n${originalText}`,
                },
            ],
            temperature: 0.7,
            max_tokens: 4096,
        })

        const translatedText = response.choices[0]?.message?.content

        if (!translatedText) {
            return { success: false, error: "No translation returned" }
        }

        return { success: true, translatedText }
    } catch (error) {
        console.error("Translation error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Translation failed",
        }
    }
}

/**
 * Translate content in chunks for long chapters
 */
export async function translateLongContent(
    originalText: string,
    chunkSize: number = 3000,
    context?: {
        novelTitle?: string
        chapterNumber?: number
    }
): Promise<TranslationResult> {
    // Split by paragraphs to maintain context
    const paragraphs = originalText.split(/\n\n+/)
    const chunks: string[] = []
    let currentChunk = ""

    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length > chunkSize && currentChunk) {
            chunks.push(currentChunk.trim())
            currentChunk = paragraph
        } else {
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim())
    }

    // Translate each chunk
    const translatedChunks: string[] = []
    for (const chunk of chunks) {
        const result = await translateContent(chunk, context)
        if (!result.success) {
            return result
        }
        translatedChunks.push(result.translatedText!)

        // Rate limiting between chunks
        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return {
        success: true,
        translatedText: translatedChunks.join("\n\n"),
    }
}

export default openai
