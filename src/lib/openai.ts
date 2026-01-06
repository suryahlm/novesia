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
        const systemPrompt = `You are an expert professional translator for Web Novels, specializing in "Interstellar", "Cultivation", and "System" genres.

Your Goal: Translate the input text from English to Indonesian (Bahasa Indonesia) with a natural, immersive, and professional literary style.

CRITICAL RULES:
1.  **Format Integrity:** PRESERVE the paragraph structure. The input uses double newlines (\\n\\n) to separate paragraphs. You MUST output the translation with the exact same paragraph separation. Do not merge paragraphs.
2.  **No Filler:** Output ONLY the translated story text. Do not add intro/outro.
3.  **Tone & Pronouns:**
    -   Use "Aku" (I) and "Kau" (You) for general narration, internal monologue, and casual/hostile dialogue.
    -   Use "Anda" (You) ONLY for strictly formal situations or addressing superiors.
    -   Do not use "Kamu" unless the tone is affectionate/romantic.
4.  **Formatting & FX:**
    -   If you detect emphatic dialogue, shouting, or sound effects in the source text (even if plain text), you may use Markdown **bold** or *italic* to emphasize them in Indonesian naturally.
5.  **Smart Terminology & Context:**
    -   "Star Domain/Sector" -> "Sektor Bintang" or "Wilayah Bintang" (Do NOT use "Domain Bintang" for locations).
    -   "Superpower Domain" -> "Domain Superpower" (Keep "Domain" specifically for the ability type).
    -   "Trade" -> "Bertransaksi" or "Bersepakat" (in mystical/business/agreement contexts). Only use "Berdagang" for actual market selling.
    -   **"Attendant/Officer/Staff":**
        -   Translate as **"Petugas"** if the character is facilitating an exam, ceremony, guarding a gate, or working in an official capacity.
        -   Translate as **"Pelayan"** ONLY if the character is serving food (waiter) or is a domestic servant (maid).
    -   "Face turned black" -> "Wajahnya menjadi suram" (Avoid literal "hitam").
6.  **Names & Titles:**
    -   Keep character names in their original form (e.g., "Su Chen" stays "Su Chen", do not translate name meanings).
    -   Translate titles contextually: "Young Master" -> "Tuan Muda", "Elder" -> "Tetua" or "Senior", "Brother" -> "Kakak/Saudara" (depending on intimacy).
7.  **Cultivation Terms:**
    -   "Qi" -> "Qi" (Keep as is).
    -   "Dantian" -> "Dantian" (Keep as is).
    -   "Foundation Establishment" -> "Pemantapan Fondasi" or "Pembangun Fondasi".
    -   "Golden Core" -> "Inti Emas".
    -   "Nascent Soul" -> **"Nascent Soul"** or **"Jiwa Nascent"** (Do NOT use "Jiwa Baru Lahir").

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
