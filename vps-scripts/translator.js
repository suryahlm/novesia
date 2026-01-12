/**
 * VPS Translator - Translate chapters that have empty contentTranslated
 * Uses Groq API for fast translation
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

const CONFIG = {
    BATCH_SIZE: 20,        // Chapters per run
    DELAY_MS: 2000,        // Delay between translations (avoid rate limit)
};

async function translateWithGroq(text) {
    if (!process.env.GROQ_API_KEY) {
        log('ERROR: GROQ_API_KEY not set in .env');
        return null;
    }

    const cleanText = text.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (cleanText.length < 50) return '';

    const maxChars = 8000;
    const chunks = [];
    for (let i = 0; i < cleanText.length; i += maxChars) {
        chunks.push(cleanText.substring(i, i + maxChars));
    }

    let translated = '';
    for (const chunk of chunks) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: 'You are a professional novel translator. Translate the following English novel chapter to Indonesian. Maintain the narrative style, emotions, and literary quality. Only output the translation, no explanations.' },
                        { role: 'user', content: chunk }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000
                })
            });

            if (response.status === 429) {
                log('  Rate limited, waiting 30s...');
                await sleep(30000);
                return null; // Skip this one, try again next run
            }

            if (!response.ok) {
                log(`  API error: ${response.status}`);
                return null;
            }

            const data = await response.json();
            translated += (data.choices?.[0]?.message?.content || '') + '\n\n';
            await sleep(500);
        } catch (err) {
            log(`  Translation error: ${err.message}`);
            return null;
        }
    }

    return translated.trim();
}

async function getUntranslatedChapters() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT c.id, c."chapterNumber", c.title, c."contentOriginal", n.title as "novelTitle"
      FROM "Chapter" c
      JOIN "Novel" n ON c."novelId" = n.id
      WHERE (c."contentTranslated" IS NULL OR c."contentTranslated" = '')
        AND c."contentOriginal" IS NOT NULL 
        AND c."contentOriginal" != ''
      ORDER BY n.title, c."chapterNumber"
      LIMIT $1
    `, [CONFIG.BATCH_SIZE]);
        return result.rows;
    } finally {
        client.release();
    }
}

async function updateTranslation(chapterId, translatedContent) {
    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE "Chapter" SET "contentTranslated" = $1, "updatedAt" = NOW() WHERE id = $2',
            [translatedContent, chapterId]
        );
        return true;
    } finally {
        client.release();
    }
}

async function getStats() {
    const client = await pool.connect();
    try {
        const total = await client.query('SELECT COUNT(*) FROM "Chapter"');
        const translated = await client.query('SELECT COUNT(*) FROM "Chapter" WHERE "contentTranslated" IS NOT NULL AND "contentTranslated" != \'\'');
        return {
            total: parseInt(total.rows[0].count),
            translated: parseInt(translated.rows[0].count)
        };
    } finally {
        client.release();
    }
}

async function main() {
    log('=== VPS TRANSLATOR - GROQ API ===');

    const stats = await getStats();
    log(`Stats: ${stats.translated}/${stats.total} chapters translated (${Math.round(stats.translated / stats.total * 100)}%)`);

    const chapters = await getUntranslatedChapters();
    log(`Found ${chapters.length} chapters to translate`);

    if (chapters.length === 0) {
        log('All chapters are translated!');
        await pool.end();
        return;
    }

    let success = 0;
    let failed = 0;

    for (const chapter of chapters) {
        log(`\nTranslating: ${chapter.novelTitle} - Ch.${chapter.chapterNumber}`);

        const translated = await translateWithGroq(chapter.contentOriginal);

        if (translated) {
            await updateTranslation(chapter.id, translated);
            success++;
            log(`  ✓ Done (${translated.length} chars)`);
        } else {
            failed++;
            log(`  ✗ Failed`);
        }

        await sleep(CONFIG.DELAY_MS);
    }

    log(`\n=== COMPLETE! ===`);
    log(`Success: ${success}, Failed: ${failed}`);

    const finalStats = await getStats();
    log(`Progress: ${finalStats.translated}/${finalStats.total} (${Math.round(finalStats.translated / finalStats.total * 100)}%)`);

    await pool.end();
}

main().catch(console.error);
