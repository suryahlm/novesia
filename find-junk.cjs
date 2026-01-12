// Script untuk mencari dan membersihkan teks sampah
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        // Find chapters containing junk text
        const result = await client.query(`
            SELECT id, title, "contentTranslated"
            FROM "Chapter" 
            WHERE "contentTranslated" LIKE '%Temukan lebih banyak%'
            OR "contentTranslated" LIKE '%**Bab %'
        `);

        console.log(`Found ${result.rows.length} chapters with junk text\n`);

        if (result.rows.length === 0) return;

        // Show samples
        result.rows.slice(0, 3).forEach(ch => {
            console.log(`[${ch.title}]:`);
            console.log(ch.contentTranslated.substring(0, 200).replace(/\n/g, '\\n'));
            console.log('---');
        });

        if (process.argv.includes('--fix')) {
            console.log('\nFixing...');
            let fixed = 0;
            for (const ch of result.rows) {
                let content = ch.contentTranslated;
                // Remove junk patterns
                content = content.replace(/Temukan lebih banyak[^\n]*\n*/gi, '');
                content = content.replace(/\*\*Bab \d+[:\s][^*]*\*\*\s*\n*/gi, '');
                content = content.trim();

                await client.query('UPDATE "Chapter" SET "contentTranslated" = $1 WHERE id = $2', [content, ch.id]);
                fixed++;
            }
            console.log(`Fixed ${fixed} chapters`);
        } else {
            console.log('\nRun with --fix to clean them up');
        }
    } finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
