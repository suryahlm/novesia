/**
 * Bulk Parallel Translation - All 10 Novels
 * Translates all novels with parallel requests for speed
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

// CometAPI Configuration
const COMET_API_KEY = process.env.COMET_API_KEY;
const COMET_BASE_URL = "https://api.cometapi.com/v1";
const MODEL = "gemini-2.0-flash";

if (!COMET_API_KEY) {
    console.error("ERROR: COMET_API_KEY not found!");
    process.exit(1);
}

// Directories
const RAW_DIR = "./scraper-data/data/raw/novels";
const TRANSLATED_DIR = "./scraper-data/data/translated/novels";

// Config
const CONCURRENT_REQUESTS = 5;
const DELAY_BETWEEN_BATCHES = 500;
const MAX_RETRIES = 3;

// Garbage text patterns to filter
const GARBAGE_PATTERNS = [
    /Temukan lebih banyak.*/gi,
    /Please buy the official.*/gi,
    /Support the author.*/gi,
    /Affiliated Links.*/gi,
    /Visit .* for more chapters/gi,
    /Join our discord.*/gi,
    /Patreon.*/gi,
    /^Book \d+\s*$/gm,
];

// Translation prompt
const SYSTEM_PROMPT = `You are an expert professional translator for Web Novels.

Translate from English to Indonesian (Bahasa Indonesia) with natural, immersive style.

CRITICAL RULES:
1. PRESERVE paragraph structure exactly - keep all double newlines between paragraphs
2. Output ONLY the translated text, no intro/outro/notes
3. Use "Aku" (I) and "Kau" (You) for dialogue
4. Keep character names original (e.g., "Su Chen", "Wei Wuxian")
5. Use **bold** for emphasis and *italic* for internal thoughts
6. Make dialogue natural for Indonesian speakers
7. Do NOT add any garbage text like "Find more books" etc`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clean content before translation
function cleanContent(content) {
    let cleaned = content;
    for (const pattern of GARBAGE_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }
    cleaned = cleaned
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return cleaned;
}

// Clean translated content
function cleanTranslated(content) {
    let cleaned = content;
    for (const pattern of GARBAGE_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }
    cleaned = cleaned
        .replace(/^(Berikut|Here is|Terjemahan).*/gim, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return cleaned;
}

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
            temperature: 0.3,
            max_tokens: 16384,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API ${response.status}: ${error.substring(0, 200)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function translateChapter(content, novelTitle, chapterNum) {
    const cleanedContent = cleanContent(content);
    const prompt = `Translate this chapter to Indonesian:\n\n${cleanedContent}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await callCometAPI(prompt);
            return cleanTranslated(result);
        } catch (error) {
            if (attempt < MAX_RETRIES) {
                await sleep(2000 * attempt);
            } else {
                throw error;
            }
        }
    }
}

async function translateNovel(novelFilename) {
    const novelPath = path.join(RAW_DIR, novelFilename);
    const outputPath = path.join(TRANSLATED_DIR, novelFilename);
    const progressFile = `./progress-${novelFilename.replace('.json', '')}.json`;

    if (!fs.existsSync(novelPath)) {
        console.error(`❌ File not found: ${novelPath}`);
        return { success: false, novel: novelFilename };
    }

    // Ensure output dir
    if (!fs.existsSync(TRANSLATED_DIR)) {
        fs.mkdirSync(TRANSLATED_DIR, { recursive: true });
    }

    // Load novel
    const novelData = JSON.parse(fs.readFileSync(novelPath, "utf8"));
    const novelTitle = novelData.novel || novelData.title || novelFilename;
    const chapters = novelData.chapters || [];

    console.log(`\n📚 ${novelTitle} (${chapters.length} chapters)`);

    // Load progress
    let progress = { translated: [] };
    if (fs.existsSync(progressFile)) {
        progress = JSON.parse(fs.readFileSync(progressFile, "utf8"));
    }

    // Load existing translation
    let translatedData = { ...novelData, chapters: [...chapters] };
    if (fs.existsSync(outputPath)) {
        translatedData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    }

    // Find chapters to translate
    const toTranslate = [];
    for (let i = 0; i < chapters.length; i++) {
        if (!progress.translated.includes(i + 1)) {
            toTranslate.push({ index: i, chapter: chapters[i], num: i + 1 });
        }
    }

    if (toTranslate.length === 0) {
        console.log(`   ✅ Already complete!`);
        return { success: true, novel: novelTitle, translated: 0, total: chapters.length };
    }

    console.log(`   📝 ${toTranslate.length} chapters remaining...`);

    let translated = 0, errors = 0;

    // Process in batches
    for (let i = 0; i < toTranslate.length; i += CONCURRENT_REQUESTS) {
        const batch = toTranslate.slice(i, i + CONCURRENT_REQUESTS);

        const results = await Promise.allSettled(
            batch.map(async ({ index, chapter, num }) => {
                const content = await translateChapter(chapter.content, novelTitle, num);
                return { index, num, content };
            })
        );

        for (const result of results) {
            if (result.status === 'fulfilled') {
                const { index, num, content } = result.value;
                translatedData.chapters[index] = {
                    ...chapters[index],
                    contentOriginal: chapters[index].content,
                    content: content,
                };
                progress.translated.push(num);
                translated++;
            } else {
                errors++;
                console.error(`   ❌ Error:`, result.reason?.message || result.reason);
            }
        }

        // Save progress after each batch
        fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
        fs.writeFileSync(outputPath, JSON.stringify(translatedData, null, 2));

        const done = progress.translated.length;
        console.log(`   [${done}/${chapters.length}] ${Math.round(done / chapters.length * 100)}%`);

        await sleep(DELAY_BETWEEN_BATCHES);
    }

    return { success: true, novel: novelTitle, translated, errors, total: chapters.length };
}

async function main() {
    console.log("═".repeat(60));
    console.log("  BULK NOVEL TRANSLATOR - 10 Novels");
    console.log("═".repeat(60));

    // List all raw novel files
    const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('_raw.json'));

    console.log(`\n📂 Found ${files.length} novels to translate\n`);

    const results = [];
    const startTime = Date.now();

    for (const file of files) {
        const result = await translateNovel(file);
        results.push(result);
    }

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log("\n" + "═".repeat(60));
    console.log("  TRANSLATION COMPLETE!");
    console.log("═".repeat(60));
    console.log(`\n⏱️  Total time: ${elapsed} minutes\n`);

    for (const r of results) {
        if (r.success) {
            console.log(`✅ ${r.novel}: ${r.translated} translated`);
        } else {
            console.log(`❌ ${r.novel}: Failed`);
        }
    }
}

main().catch(console.error);
