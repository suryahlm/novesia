// Set novels to English language
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    console.log('🌍 Moving scraped novels to English...\n');

    const result = await pool.query(`
        UPDATE "Novel" 
        SET language = 'en', "updatedAt" = NOW() 
        WHERE "sourceUrl" LIKE '%asianovel.net%'
        RETURNING title
    `);

    console.log(`✅ Updated ${result.rowCount} novels to English:\n`);
    result.rows.forEach(r => console.log(`  - ${r.title}`));

    await pool.end();
}

main().catch(console.error);
