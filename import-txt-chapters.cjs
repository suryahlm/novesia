// Import translated chapters from TXT file
// Usage: node import-txt-chapters.cjs

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configuration
const NOVEL_SLUG = 'rebirth-of-a-majestic-empress';
const TXT_FILE = 'D:\\Surya\\IT\\07 Novesia\\Translate\\Rebirth of a Majestic Empress - chapter 5-10.txt';
const START_CHAPTER = 5;
const END_CHAPTER = 10;

async function main() {
    console.log('📖 Importing translated chapters...\n');
    console.log(`Novel: ${NOVEL_SLUG}`);
    console.log(`File: ${TXT_FILE}`);
    console.log(`Chapters: ${START_CHAPTER}-${END_CHAPTER}\n`);

    // Read file
    const content = fs.readFileSync(TXT_FILE, 'utf8');

    // Split by chapter headers (Bab X)
    const chapterRegex = /Bab (\d+)\s*\r?\n/gi;
    const chapters = [];
    let lastIndex = 0;
    let match;
    let prevChapterNum = null;

    while ((match = chapterRegex.exec(content)) !== null) {
        if (prevChapterNum !== null) {
            const chapterContent = content.substring(lastIndex, match.index).trim();
            chapters.push({
                number: prevChapterNum,
                content: chapterContent
            });
        }
        prevChapterNum = parseInt(match[1]);
        lastIndex = match.index + match[0].length;
    }

    // Get last chapter
    if (prevChapterNum !== null) {
        const chapterContent = content.substring(lastIndex).trim();
        chapters.push({
            number: prevChapterNum,
            content: chapterContent
        });
    }

    console.log(`📄 Parsed ${chapters.length} chapters:\n`);
    chapters.forEach(ch => {
        console.log(`   Chapter ${ch.number}: ${ch.content.substring(0, 50)}...`);
    });

    // Get novel ID
    const novelRes = await pool.query(
        'SELECT id, title FROM "Novel" WHERE slug = $1',
        [NOVEL_SLUG]
    );

    if (novelRes.rows.length === 0) {
        console.log('❌ Novel not found');
        await pool.end();
        return;
    }

    const novel = novelRes.rows[0];
    console.log(`\n📚 Found novel: ${novel.title} (ID: ${novel.id})\n`);

    // Update each chapter
    let updated = 0;
    let failed = 0;

    for (const ch of chapters) {
        try {
            // Convert plain text to HTML paragraphs
            const htmlContent = ch.content
                .split(/\r?\n\r?\n/)
                .filter(p => p.trim())
                .map(p => `<p>${p.trim()}</p>`)
                .join('\n');

            const result = await pool.query(
                `UPDATE "Chapter" 
                 SET "contentOriginal" = $1, "updatedAt" = NOW() 
                 WHERE "novelId" = $2 AND "chapterNumber" = $3
                 RETURNING id, title`,
                [htmlContent, novel.id, ch.number]
            );

            if (result.rows.length > 0) {
                console.log(`✅ Chapter ${ch.number}: ${result.rows[0].title}`);
                updated++;
            } else {
                console.log(`⚠️ Chapter ${ch.number}: Not found in database`);
                failed++;
            }

        } catch (err) {
            console.log(`❌ Chapter ${ch.number}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Failed: ${failed}`);

    // Update novel language to Indonesian
    if (updated > 0) {
        await pool.query(
            'UPDATE "Novel" SET language = $1, "updatedAt" = NOW() WHERE id = $2',
            ['id', novel.id]
        );
        console.log(`\n📘 Novel language changed to Indonesian!`);
    }

    await pool.end();
}

main().catch(console.error);
