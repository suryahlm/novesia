// Find chapters from Green Tea novel
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        // Find Green Tea novel
        const novels = await client.query(`SELECT id, title FROM "Novel" WHERE title ILIKE '%Green Tea%'`);
        console.log('Novels found:', novels.rows.length);

        if (novels.rows.length === 0) return;

        const novelId = novels.rows[0].id;
        console.log('Novel:', novels.rows[0].title, '\n');

        // Get chapters 16, 17
        const chapters = await client.query(`
            SELECT id, "chapterNumber", title, 
                   LEFT("contentTranslated", 400) as ct,
                   LEFT("contentOriginal", 400) as co
            FROM "Chapter" 
            WHERE "novelId" = $1 AND "chapterNumber" IN (16, 17)
        `, [novelId]);

        chapters.rows.forEach(ch => {
            console.log(`=== Chapter ${ch.chapterNumber}: ${ch.title} ===`);
            console.log('Translated (first 300 chars):');
            console.log(ch.ct?.substring(0, 300) || '(empty)');
            console.log('\nOriginal (first 300 chars):');
            console.log(ch.co?.substring(0, 300) || '(empty)');
            console.log('\n---\n');
        });

    } finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
