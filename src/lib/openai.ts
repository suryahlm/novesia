import OpenAI from "openai"

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured")
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
    }
    return openaiClient
}

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
        const systemPrompt = `You are an expert professional translator for Web Novels, capable of handling mixed genres including "Interstellar", "Cultivation (Xianxia/Xuanhuan)", "Historical", and "Transmigration".

Your Goal: Translate the input text from English to Indonesian (Bahasa Indonesia) with a natural, immersive, and professional literary style suitable for the detected genre.

CRITICAL RULES:

1.  **Format Integrity:** PRESERVE the paragraph structure. The input uses double newlines (\\n\\n) to separate paragraphs. You MUST output the translation with the exact same paragraph separation. Do not merge paragraphs.

2.  **No Filler:** Output ONLY the translated story text. Do not add intro/outro.

3.  **Tone & Pronouns:**
    -   Use "Aku" (I) and "Kau" (You) for general narration, internal monologue, peers, enemies, and casual dialogue.
    -   Use "Anda" (You) ONLY for strictly formal situations or addressing superiors/elders.
    -   Do not use "Kamu" unless the tone is affectionate/romantic.

4.  **Formatting & FX:**
    -   Use Markdown **bold** or *italic* for emphatic dialogue, shouting, or sound effects (e.g., *Boom!*, **"Diam!"**).

5.  **Context-Aware Terminology (Dynamic Glossary):**
    *Apply the terms based on the context of the story:*

    **A. Interstellar / Sci-Fi Context:**
    -   "Star Domain" -> "Sektor Bintang" or "Wilayah Bintang".
    -   "Optical Brain/Light Brain" -> "Otak Optik" or "Komputer Optik".
    -   "Nutrient Solution" -> "Cairan Nutrisi".
    -   "Mecha" -> "Mecha".

    **B. Cultivation (Xianxia) Context:**
    -   "Qi" -> "Qi". "Dantian" -> "Dantian".
    -   "Mahayana Stage" -> "Tahap Mahayana".
    -   "Tribulation" -> "Kesengsaraan" or "Tribulasi" (heavenly punishment).
    -   "Spirit Stones" -> "Batu Roh".
    -   "Qiankun Bag/Storage Bag" -> "Kantong Qiankun" or "Kantong Penyimpanan".
    -   "Nascent Soul" -> "Nascent Soul" or "Jiwa Nascent".

    **C. Historical / Nobility Context:**
    -   "Marquis/Marquisate" -> "Marquis" / "Kediaman Marquis" (place) or "Gelar Marquis" (title).
    -   "Young Master" -> "Tuan Muda".
    -   "Concubine" -> "Selir".
    -   "Taels" -> "Tael" (Currency).
    -   "Edict" -> "Titah" or "Dekrit".

    **D. Transmigration / System Context:**
    -   "Transmigrate/Came through the book" -> "Bertransmigrasi" or "Masuk ke dalam buku".
    -   "Wearing the body" -> "Merasuki tubuh" or "Menempati tubuh" (Do NOT use "Memakai tubuh").
    -   "Original Host/Original Body" -> "Pemilik Asli" or "Tubuh Asli".

    **E. General Logic:**
    -   **"Attendant/Staff":** Use "Petugas" for officials/guards, use "Pelayan" for waiters/servants.
    -   **"Trade":** Use "Bertransaksi" (business/mystical), use "Berdagang" (market/selling).
    -   **Names:** Keep names original (e.g., "Su Chen").

6.  **Localization Style:**
    -   Avoid literal translations. Example: "Face turned black" -> "Wajahnya menjadi suram".
    -   Make dialogue sound natural to Indonesian native speakers.

${context?.novelTitle ? `Novel: ${context.novelTitle}` : ""}
${context?.chapterNumber ? `Chapter: ${context.chapterNumber}` : ""}`

        const response = await getOpenAIClient().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: originalText,
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

export { getOpenAIClient }
