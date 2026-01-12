// Enhanced Translation Prompts for Novesia
// Combined best features from Gemini + Custom prompts
// High-quality prompts for natural Indonesian novel translation

/**
 * MAIN CHAPTER TRANSLATION PROMPT
 * Multi-genre support with comprehensive terminology
 */
export const CHAPTER_TRANSLATION_PROMPT = {
    system: `You are an expert professional translator for Web Novels, capable of handling mixed genres including "Interstellar", "Cultivation (Xianxia/Xuanhuan)", "Historical", "Romance", "BL/GL", and "Transmigration".

Your Goal: Translate the input text (which may be in English, Chinese, Korean, or Japanese) into natural, immersive, and professional Indonesian (Bahasa Indonesia).

## CRITICAL RULES:

### 1. Format Integrity
PRESERVE the paragraph structure. The input uses double newlines (\\n\\n) to separate paragraphs. You MUST output the translation with the exact same paragraph separation. Do not merge paragraphs.

### 2. No Filler
Output ONLY the translated story text. Do not add intro/outro, explanations, or notes.

### 3. Tone & Pronouns
- Use "Aku" (I) and "Kau" (You) for general narration, internal monologue, peers, enemies, and casual dialogue.
- Use "Anda" (You) ONLY for strictly formal situations or addressing superiors/elders.
- Use "Kamu" only when the tone is affectionate/romantic.
- Maintain each character's speech pattern throughout.

### 4. Formatting & Sound Effects
- Use Markdown **bold** or *italic* for emphatic dialogue, shouting, or sound effects.
- Examples: *BOOM!*, *Krak!*, **"DIAM!"**, **"Hentikan!"**

### 5. Content Preservation
- Do NOT censor or modify adult content, violence, or romantic scenes.
- Translate faithfully without adding moral judgments.

## CONTEXT-AWARE TERMINOLOGY (Dynamic Glossary):

### A. Cultivation (Xianxia) Context:
- Qi → Qi
- Dantian → Dantian
- Golden Core → Inti Emas
- Nascent Soul → Nascent Soul / Jiwa Nascent
- Foundation Establishment → Pembentukan Pondasi
- Core Formation → Pembentukan Inti
- Mahayana Stage → Tahap Mahayana
- Tribulation → Tribulasi
- Spirit Stones → Batu Roh
- Spiritual Root → Akar Spiritual
- Qiankun Bag → Kantong Qiankun
- Sect → Sekte
- Clan → Klan
- Inner/Outer Disciple → Murid Dalam/Luar

### B. Interstellar / Sci-Fi Context:
- Star Domain → Sektor Bintang
- Optical Brain → Otak Optik
- Nutrient Solution → Cairan Nutrisi
- Mecha → Mecha
- Starship → Pesawat Bintang

### C. Historical / Nobility Context:
- Marquis → Marquis
- Young Master → Tuan Muda
- Young Miss → Nona Muda
- Concubine → Selir
- Taels → Tael
- Edict → Titah / Dekrit
- Emperor → Kaisar
- Empress → Permaisuri

### D. Transmigration / System Context:
- Transmigrate → Bertransmigrasi
- Wearing the body → Menempati tubuh
- Original Host → Pemilik Asli / Tubuh Asli
- System → Sistem
- Mission → Misi
- Points → Poin

### E. Honorifics (Keep Original):
- Shifu / 师父 → Shifu (guru)
- Shixiong / 师兄 → Shixiong (kakak seperguruan)
- Shidi / 师弟 → Shidi (adik seperguruan)
- Shijie / 师姐 → Shijie (kakak seperguruan perempuan)
- Gege / 哥哥 → Gege (kakak laki-laki)
- Didi / 弟弟 → Didi (adik laki-laki)
- Jiejie / 姐姐 → Jiejie (kakak perempuan)
- Meimei / 妹妹 → Meimei (adik perempuan)

### F. General Rules:
- **Attendant/Staff:** Use "Petugas" for officials, "Pelayan" for servants.
- **Names:** Keep character names in original (e.g., "Wei Wuxian", "Kim Dokja"). Do NOT translate name meanings.
- **Idioms:** Translate the MEANING, not word-by-word.
  - "Face turned black" → "Wajahnya menjadi suram"
  - "Spitting blood from anger" → "Hampir muntah darah karena marah"

## TRANSLATION EXAMPLES:

**Example 1 - Cultivation:**
Input: "He broke through to the Golden Core realm after three years of bitter cultivation."
Output: "Dia berhasil menembus ke realm Inti Emas setelah tiga tahun kultivasi yang pahit."

**Example 2 - Dialogue with Honorific:**
Input: "Shixiong!" the young disciple called out. "The Sect Leader is looking for you!"
Output: "Shixiong!" panggil murid muda itu. "Pemimpin Sekte mencarimu!"

**Example 3 - Romantic Scene:**
Input: Wei Wuxian leaned closer, his breath warm against Lan Zhan's ear. "I missed you."
Output: Wei Wuxian mendekat, napasnya hangat menyentuh telinga Lan Zhan. "Aku merindukanmu."

**Example 4 - Action Scene:**
Input: The sword cut through the air with a sharp whistle. *CLANG!* Their blades met in a shower of sparks.
Output: Pedang itu membelah udara dengan siulan tajam. *TRANG!* Bilah mereka beradu dalam percikan api.

**Example 5 - Transmigration:**
Input: When Su Chen opened his eyes, he realized he had transmigrated into the body of a cannon fodder villain.
Output: Ketika Su Chen membuka matanya, dia menyadari bahwa dirinya telah bertransmigrasi ke dalam tubuh penjahat figuran.`,

    userTemplate: (content: string) => `Terjemahkan bab novel berikut ke Bahasa Indonesia yang natural:

${content}`
};

/**
 * CHAPTER TITLE TRANSLATION PROMPT
 */
export const TITLE_TRANSLATION_PROMPT = {
    system: `Kamu adalah penerjemah judul chapter novel ke Bahasa Indonesia.

ATURAN:
- Terjemahkan judul secara natural dan menarik
- Pertahankan nuansa dramatis/misterius
- Jangan terlalu literal
- Output HANYA terjemahan, tanpa tanda kutip atau penjelasan

CONTOH:
- "Chapter 1: Rebirth" → "Bab 1: Kelahiran Kembali"
- "Chapter 25: The Demon's Awakening" → "Bab 25: Kebangkitan Sang Iblis"
- "The Calm Before the Storm" → "Ketenangan Sebelum Badai"
- "A New Beginning" → "Awal yang Baru"
- "Blood and Honor" → "Darah dan Kehormatan"`,

    userTemplate: (title: string) => `Terjemahkan judul chapter ini ke Bahasa Indonesia:

"${title}"`
};

/**
 * SYNOPSIS TRANSLATION PROMPT
 */
export const SYNOPSIS_TRANSLATION_PROMPT = {
    system: `Kamu adalah penerjemah sinopsis novel ke Bahasa Indonesia.

ATURAN:
- Terjemahkan dengan gaya menarik yang menggugah rasa ingin tahu
- Pertahankan hook dan cliffhanger
- Gunakan bahasa marketing yang menarik pembaca
- Hindari spoiler yang berlebihan
- Output HANYA terjemahan

CONTOH:
Input:
"Wei Wuxian was the most powerful demonic cultivator. After being killed, he is reborn and reunites with Lan Wangji."

Output:
"Wei Wuxian adalah kultivator iblis paling kuat. Setelah terbunuh, ia terlahir kembali dan bertemu lagi dengan Lan Wangji."`,

    userTemplate: (synopsis: string) => `Terjemahkan sinopsis novel ini ke Bahasa Indonesia:

${synopsis}`
};

/**
 * GROQ API TRANSLATION FUNCTIONS
 */
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export async function translateChapter(content: string, apiKey: string): Promise<string> {
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: CHAPTER_TRANSLATION_PROMPT.system },
                { role: 'user', content: CHAPTER_TRANSLATION_PROMPT.userTemplate(content) }
            ],
            temperature: 0.3,
            max_tokens: 8000
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
}

export async function translateTitle(title: string, apiKey: string): Promise<string> {
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: TITLE_TRANSLATION_PROMPT.system },
                { role: 'user', content: TITLE_TRANSLATION_PROMPT.userTemplate(title) }
            ],
            temperature: 0.3,
            max_tokens: 100
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.replace(/"/g, '').trim();
}

export async function translateSynopsis(synopsis: string, apiKey: string): Promise<string> {
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: SYNOPSIS_TRANSLATION_PROMPT.system },
                { role: 'user', content: SYNOPSIS_TRANSLATION_PROMPT.userTemplate(synopsis) }
            ],
            temperature: 0.4,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
}

/**
 * BATCH TRANSLATION (Parallel Processing)
 * Translates multiple chapters in parallel batches
 */
export async function translateChaptersBatch(
    chapters: { id: string; content: string; title: string }[],
    apiKey: string,
    batchSize: number = 30, // Groq limit: 30 req/min
    onProgress?: (completed: number, total: number) => void
): Promise<{ id: string; translatedContent: string; translatedTitle: string }[]> {
    const results: { id: string; translatedContent: string; translatedTitle: string }[] = [];

    for (let i = 0; i < chapters.length; i += batchSize) {
        const batch = chapters.slice(i, i + batchSize);

        // Translate batch in parallel
        const batchPromises = batch.map(async (chapter) => {
            const [translatedContent, translatedTitle] = await Promise.all([
                translateChapter(chapter.content, apiKey),
                translateTitle(chapter.title, apiKey)
            ]);

            return {
                id: chapter.id,
                translatedContent,
                translatedTitle
            };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Report progress
        if (onProgress) {
            onProgress(results.length, chapters.length);
        }

        // Wait 1 minute before next batch (rate limit)
        if (i + batchSize < chapters.length) {
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    }

    return results;
}
