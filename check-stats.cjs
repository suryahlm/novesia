// Check scraping stats
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const novels = await pool.query(`
        SELECT COUNT(*) as total 
        FROM "Novel" 
        WHERE "sourceUrl" LIKE '%asianovel.net%'
    `);

    const chapters = await pool.query(`
        SELECT COUNT(*) as total 
        FROM "Chapter" c 
        JOIN "Novel" n ON c."novelId" = n.id 
        WHERE n."sourceUrl" LIKE '%asianovel.net%'
    `);

    const novelList = await pool.query(`
        SELECT n.title, COUNT(c.id) as chapters 
        FROM "Novel" n 
        LEFT JOIN "Chapter" c ON c."novelId" = n.id 
        WHERE n."sourceUrl" LIKE '%asianovel.net%'
        GROUP BY n.id 
        ORDER BY n."createdAt" DESC
    `);

    console.log('📊 Scraping Stats:');
    console.log(`   Novels: ${novels.rows[0].total}`);
    console.log(`   Chapters: ${chapters.rows[0].total}\n`);

    console.log('📚 Novel List:');
    novelList.rows.forEach(r => console.log(`   - ${r.title} (${r.chapters} ch)`));

    await pool.end();
}

main();
