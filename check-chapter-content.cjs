// Check chapter content in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const result = await pool.query(`
        SELECT "chapterNumber", LEFT("contentOriginal", 200) as preview 
        FROM "Chapter" 
        WHERE "novelId" = (SELECT id FROM "Novel" WHERE slug = 'rebirth-of-a-majestic-empress') 
        AND "chapterNumber" BETWEEN 5 AND 10 
        ORDER BY "chapterNumber"
    `);

    console.log('Chapter content preview:');
    console.log('========================');
    for (const row of result.rows) {
        const isIndonesian = row.preview.includes('Titik Balik') ||
            row.preview.includes('Dinasti') ||
            row.preview.includes('pernikahan') ||
            row.preview.includes('Resepsi');
        console.log(`\nCh ${row.chapterNumber} [${isIndonesian ? 'ID' : 'EN'}]:`);
        console.log(row.preview);
    }

    await pool.end();
}

main();
