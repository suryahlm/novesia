/**
 * Parallel Translation Script - Translate specific novel
 * Usage: node translate-single.cjs <novel-filename>
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

// CometAPI Configuration
const COMET_API_KEY = process.env.COMET_API_KEY;
const COMET_BASE_URL = "https://api.cometapi.com/v1";
const MODEL = "gemini-2.5-flash-lite-preview-09-2025";

if (!COMET_API_KEY) {
    console.error("ERROR: COMET_API_KEY not found!");
    process.exit(1);
}

// Get novel filename from args
const novelFilename = process.argv[2];
if (!novelFilename) {
    console.error("Usage: node translate-single.cjs <novel-filename.json>");
    process.exit(1);
}

// Translation prompt
const SYSTEM_PROMPT = `You are an expert professional translator for Web Novels.

Translate from English to Indonesian (Bahasa Indonesia) with natural, immersive style.

RULES:
1. PRESERVE paragraph structure (double newlines)
2. Output ONLY translated text, no intro/outro
3. Use "Aku" (I) and "Kau" (You) for dialogue
4. Use "Anda" only for formal situations
5. Keep character names original (e.g., "Su Chen")
6. Use **bold** or *italic* for emphasis/sound effects
7. Make dialogue natural for Indonesian speakers`;

// Directories
const RAW_DIR = "./scraper-data/data/raw/novels";
const TRANSLATED_DIR = "./scraper-data/data/translated/novels";

// Rate limiting
const DELAY_MS = 2000;
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
            temperature: 0.4,
            max_tokens: 8192,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function translateChapter(content, novelTitle, chapterNum) {
    const prompt = `Novel: ${novelTitle}\nChapter: ${chapterNum}\n\nTranslate to Indonesian:\n\n${content}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await callCometAPI(prompt);
        } catch (error) {
            console.error(`  Attempt ${attempt} failed:`, error.message);
            if (attempt < MAX_RETRIES) {
                await sleep(DELAY_MS * attempt * 2);
            } else {
                throw error;
            }
        }
    }
}

async function translateNovel() {
    const novelPath = path.join(RAW_DIR, novelFilename);
    const outputPath = path.join(TRANSLATED_DIR, novelFilename);
    const progressFile = `./progress-${novelFilename.replace('.json', '')}.json`;

    console.log("=".repeat(50));
    console.log(`TRANSLATING: ${novelFilename}`);
    console.log("=".repeat(50));

    if (!fs.existsSync(novelPath)) {
        console.error(`File not found: ${novelPath}`);
        process.exit(1);
    }

    // Ensure output dir
    if (!fs.existsSync(TRANSLATED_DIR)) {
        fs.mkdirSync(TRANSLATED_DIR, { recursive: true });
    }

    // Load novel
    const novelData = JSON.parse(fs.readFileSync(novelPath, "utf8"));
    const novelTitle = novelData.title || novelFilename;
    const chapters = novelData.chapters || [];

    console.log(`Title: ${novelTitle}`);
    console.log(`Chapters: ${chapters.length}`);

    // Load progress
    let progress = { translated: [] };
    if (fs.existsSync(progressFile)) {
        progress = JSON.parse(fs.readFileSync(progressFile, "utf8"));
    }

    // Load existing translation
    let translatedData = { ...novelData, chapters: [] };
    if (fs.existsSync(outputPath)) {
        translatedData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    }

    let translated = 0, skipped = 0, errors = 0;

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterNum = i + 1;

        if (progress.translated.includes(chapterNum)) {
            skipped++;
            continue;
        }

        console.log(`Translating ${chapterNum}/${chapters.length}...`);

        try {
            const translatedContent = await translateChapter(chapter.content, novelTitle, chapterNum);

            translatedData.chapters[i] = {
                ...chapter,
                contentOriginal: chapter.content,
                content: translatedContent,
            };

            progress.translated.push(chapterNum);
            fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
            fs.writeFileSync(outputPath, JSON.stringify(translatedData, null, 2));

            translated++;
            console.log(`✓ Chapter ${chapterNum} done`);

            await sleep(DELAY_MS);
        } catch (error) {
            console.error(`✗ Chapter ${chapterNum} failed:`, error.message);
            errors++;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`DONE: ${novelFilename}`);
    console.log(`Translated: ${translated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log("=".repeat(50));
}

translateNovel().catch(console.error);
