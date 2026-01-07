/**
 * Translation Script using CometAPI + Gemini 2.5 Flash Lite
 * Much cheaper: $0.08/M input, $0.32/M output
 * High throughput for bulk translation
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

// CometAPI Configuration
const COMET_API_KEY = process.env.COMET_API_KEY;
const COMET_BASE_URL = "https://api.cometapi.com/v1";
const MODEL = "gemini-2.5-flash-lite-preview-09-2025";

if (!COMET_API_KEY) {
    console.error("ERROR: COMET_API_KEY not found in environment variables!");
    process.exit(1);
}

// Translation prompt (same as before)
const SYSTEM_PROMPT = `You are an expert professional translator for Web Novels, capable of handling mixed genres including "Interstellar", "Cultivation (Xianxia/Xuanhuan)", "Historical", and "Transmigration".

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
    -   Make dialogue sound natural to Indonesian native speakers.`;

// Directories
const RAW_DIR = "./scraper-data/data/raw/novels";
const TRANSLATED_DIR = "./scraper-data/data/translated/novels";
const PROGRESS_FILE = "./translation-progress-flashlite.json";

// Rate limiting - Flash Lite allows higher throughput
const DELAY_MS = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const CONCURRENT_REQUESTS = 3; // Process 3 chapters at a time

// Helper: Sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Call CometAPI
async function callCometAPI(prompt) {
    const response = await fetch(`${COMET_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${COMET_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            temperature: 0.4, // Lower for more consistent translation
            max_tokens: 8192,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`CometAPI Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Helper: Translate single chapter
async function translateChapter(content, novelTitle, chapterNum) {
    const prompt = `Novel: ${novelTitle}
Chapter: ${chapterNum}

Translate the following text to Indonesian:

${content}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await callCometAPI(prompt);
        } catch (error) {
            console.error(`  Attempt ${attempt} failed:`, error.message);
            if (attempt < MAX_RETRIES) {
                const backoff = DELAY_MS * attempt * 2;
                console.log(`  Retrying in ${backoff / 1000}s...`);
                await sleep(backoff);
            } else {
                throw error;
            }
        }
    }
}

// Helper: Load progress
function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    }
    return {};
}

// Helper: Save progress
function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Main translation function
async function translateNovels() {
    console.log("=".repeat(60));
    console.log("COMET API + GEMINI 2.5 FLASH LITE TRANSLATION");
    console.log("=".repeat(60));
    console.log(`Model: ${MODEL}`);
    console.log(`Started at: ${new Date().toLocaleString()}`);

    // Ensure output directory exists
    if (!fs.existsSync(TRANSLATED_DIR)) {
        fs.mkdirSync(TRANSLATED_DIR, { recursive: true });
    }

    // Get all novel files
    const novelFiles = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".json"));
    console.log(`Found ${novelFiles.length} novels to translate\n`);

    // Load progress
    const progress = loadProgress();
    let totalTranslated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const file of novelFiles) {
        const novelPath = path.join(RAW_DIR, file);
        const outputPath = path.join(TRANSLATED_DIR, file);

        console.log(`\n${"=".repeat(60)}`);
        console.log(`Processing: ${file}`);

        try {
            // Load novel data
            const novelData = JSON.parse(fs.readFileSync(novelPath, "utf8"));
            const novelTitle = novelData.title || file;
            const chapters = novelData.chapters || [];

            console.log(`  Title: ${novelTitle}`);
            console.log(`  Chapters: ${chapters.length}`);

            // Initialize progress for this novel
            if (!progress[file]) {
                progress[file] = { translated: [], lastChapter: 0 };
            }

            // Load existing translated data or start fresh
            let translatedData = { ...novelData, chapters: [] };
            if (fs.existsSync(outputPath)) {
                translatedData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
            }

            // Process chapters
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                const chapterNum = i + 1;

                // Skip if already translated
                if (progress[file].translated.includes(chapterNum)) {
                    totalSkipped++;
                    continue;
                }

                console.log(`  Translating chapter ${chapterNum}/${chapters.length}...`);

                try {
                    // Translate content
                    const translatedContent = await translateChapter(
                        chapter.content,
                        novelTitle,
                        chapterNum
                    );

                    // Add to translated data
                    translatedData.chapters[i] = {
                        ...chapter,
                        contentOriginal: chapter.content,
                        content: translatedContent,
                    };

                    // Update progress
                    progress[file].translated.push(chapterNum);
                    progress[file].lastChapter = chapterNum;
                    saveProgress(progress);

                    // Save translated novel
                    fs.writeFileSync(outputPath, JSON.stringify(translatedData, null, 2));

                    totalTranslated++;
                    console.log(`  ✓ Chapter ${chapterNum} translated`);

                    // Rate limiting
                    await sleep(DELAY_MS);
                } catch (error) {
                    console.error(`  ✗ Error translating chapter ${chapterNum}:`, error.message);
                    totalErrors++;
                    // Save progress even on error
                    saveProgress(progress);
                }
            }

            console.log(`  ✓ Novel completed!`);
        } catch (error) {
            console.error(`  ✗ Error processing novel:`, error.message);
            totalErrors++;
        }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log("TRANSLATION COMPLETE");
    console.log(`  Translated: ${totalTranslated} chapters`);
    console.log(`  Skipped: ${totalSkipped} chapters`);
    console.log(`  Errors: ${totalErrors}`);
    console.log(`  Finished at: ${new Date().toLocaleString()}`);
    console.log("=".repeat(60));
}

// Run
translateNovels().catch(console.error);
