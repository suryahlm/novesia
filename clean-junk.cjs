// Comprehensive junk text finder/cleaner
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        console.log("🔍 Searching for junk text in both fields...\n");

        const result = await client.query(`
            SELECT id, title, "chapterNumber",
                   "contentTranslated", "contentOriginal"
            FROM "Chapter" 
            WHERE "contentTranslated" LIKE '%Temukan lebih banyak%'
               OR "contentOriginal" LIKE '%Temukan lebih banyak%'
               OR "contentTranslated" LIKE '%**Bab %'
               OR "contentOriginal" LIKE '%**Bab %'
        `);

        console.log(`Found ${result.rows.length} chapters with junk\n`);

        if (result.rows.length === 0) {
            console.log("No junk found!");
            return;
        }

        // Show first 3
        result.rows.slice(0, 3).forEach(ch => {
            console.log(`Ch ${ch.chapterNumber}: ${ch.title}`);
            const ct = ch.contentTranslated?.substring(0, 150)?.replace(/\n/g, '|') || '(empty)';
            const co = ch.contentOriginal?.substring(0, 150)?.replace(/\n/g, '|') || '(empty)';
            console.log('  T:', ct);
            console.log('  O:', co);
        });

        if (process.argv.includes('--fix')) {
            console.log('\n🔧 Fixing...');
            let fixed = 0;
            for (const ch of result.rows) {
                let ct = ch.contentTranslated || '';
                let co = ch.contentOriginal || '';

                // Clean both
                const clean = (s) => s
                    .replace(/Temukan lebih banyak[^\n]*\n*/gi, '')
                    .replace(/\*\*Bab \d+[:\s][^*]*\*\*\s*\n*/gi, '')
                    .trim();

                const newCt = clean(ct);
                const newCo = clean(co);

                if (newCt !== ct || newCo !== co) {
                    await client.query(
                        'UPDATE "Chapter" SET "contentTranslated" = $1, "contentOriginal" = $2 WHERE id = $3',
                        [newCt || ct, newCo || co, ch.id]
                    );
                    fixed++;
                }
            }
            console.log(`✅ Fixed ${fixed} chapters`);
        } else {
            console.log('\nRun with --fix to clean');
        }

    } finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
