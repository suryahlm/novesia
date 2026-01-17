// Move Burst the Actor to English
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const result = await pool.query(`
        UPDATE "Novel" 
        SET language = 'en', "updatedAt" = NOW() 
        WHERE slug = 'burst-the-actor-was-won-by-the-newcomer'
        RETURNING title
    `);

    if (result.rows.length > 0) {
        console.log('✅ Moved to English:', result.rows[0].title);
    } else {
        console.log('❌ Novel not found');
    }

    await pool.end();
}

main();
