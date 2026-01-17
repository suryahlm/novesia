// Translate Novel using Groq API
// Run: node translate-groq.cjs [novel-slug]

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Fast and good for translation

async function translateText(text) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional translator. Translate the following English text to Indonesian. Keep HTML tags intact. Maintain the original meaning and tone. Only output the translated text, nothing else.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 8000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function main() {
    const novelSlug = process.argv[2];

    if (!novelSlug) {
        // List available English novels
        const novels = await pool.query(`
            SELECT slug, title, 
                   (SELECT COUNT(*) FROM "Chapter" WHERE "novelId" = "Novel".id) as chapters
            FROM "Novel" 
            WHERE language = 'en'
            ORDER BY title
        `);

        console.log('📚 English Novels available for translation:\n');
        novels.rows.forEach(n => console.log(`   ${n.slug} (${n.chapters} ch)`));
        console.log('\nUsage: node translate-groq.cjs <novel-slug>');
        await pool.end();
        return;
    }

    console.log(`🌐 Translating: ${novelSlug}\n`);

    // Get novel
    const novelRes = await pool.query(
        'SELECT id, title FROM "Novel" WHERE slug = $1 AND language = $2',
        [novelSlug, 'en']
    );

    if (novelRes.rows.length === 0) {
        console.log('❌ Novel not found or not in English');
        await pool.end();
        return;
    }

    const novel = novelRes.rows[0];
    console.log(`📖 Novel: ${novel.title}`);

    // Get chapters
    const chaptersRes = await pool.query(
        'SELECT id, title, "chapterNumber", "contentOriginal", "contentTranslated" FROM "Chapter" WHERE "novelId" = $1 ORDER BY "chapterNumber"',
        [novel.id]
    );

    console.log(`📄 Total chapters: ${chaptersRes.rows.length}\n`);

    let translated = 0;
    let skipped = 0;
    let failed = 0;

    for (const chapter of chaptersRes.rows) {
        // Skip if already translated
        if (chapter.contentTranslated && chapter.contentTranslated !== chapter.contentOriginal) {
            process.stdout.write('.');
            skipped++;
            continue;
        }

        console.log(`\n🔄 Ch ${chapter.chapterNumber}: ${chapter.title}`);

        try {
            // Translate content
            const translatedContent = await translateText(chapter.contentOriginal);

            // Update database
            await pool.query(
                'UPDATE "Chapter" SET "contentTranslated" = $1, "updatedAt" = NOW() WHERE id = $2',
                [translatedContent, chapter.id]
            );

            console.log(`   ✅ Translated (${translatedContent.length} chars)`);
            translated++;

            // Rate limit - Groq has limits
            await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n\n🎉 Done!`);
    console.log(`   Translated: ${translated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);

    // Update novel language if all translated
    if (translated > 0 && failed === 0) {
        await pool.query(
            'UPDATE "Novel" SET language = $1, "updatedAt" = NOW() WHERE id = $2',
            ['id', novel.id]
        );
        console.log(`\n📘 Novel moved to Indonesian!`);
    }

    await pool.end();
}

main().catch(console.error);
