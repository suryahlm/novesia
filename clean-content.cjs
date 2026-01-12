// Script untuk menghapus "Catatan Penulis" dan bintang dari konten
// Jalankan: node clean-content.cjs

require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        console.log("🔍 Searching for chapters with author notes or asterisks...\n");

        // Find chapters with issue patterns  
        const result = await client.query(`
            SELECT id, title, "contentTranslated", "contentOriginal"
            FROM "Chapter" 
            WHERE "contentTranslated" LIKE '%**Catatan Penulis**%'
               OR "contentOriginal" LIKE '%**Catatan Penulis**%'
               OR "contentTranslated" LIKE '%*%'
               OR "contentOriginal" LIKE '%*%'
        `);

        console.log(`Found ${result.rows.length} chapters to clean\n`);

        if (result.rows.length === 0) {
            console.log("Nothing to clean!");
            return;
        }

        // Show sample
        let sampleCount = 0;
        for (const ch of result.rows.slice(0, 3)) {
            const content = ch.contentTranslated || ch.contentOriginal || '';
            if (content.includes('**Catatan Penulis**') || content.includes('*')) {
                console.log(`[${ch.title}]`);
                console.log('  Has asterisks:', content.includes('*'));
                console.log('  Has Catatan Penulis:', content.includes('**Catatan Penulis**'));
                sampleCount++;
            }
        }

        if (!process.argv.includes('--fix')) {
            console.log('\nRun with --fix to clean all');
            return;
        }

        console.log('\n🔧 Cleaning...');
        let fixed = 0;

        for (const ch of result.rows) {
            let ct = ch.contentTranslated || '';
            let co = ch.contentOriginal || '';

            const clean = (s) => {
                if (!s) return s;

                // Remove "**Catatan Penulis**" sections (from that point to end of paragraph or double newline)
                s = s.replace(/\*\*Catatan Penulis\*\*[\s\S]*?(\n\n|$)/gi, '\n\n');

                // Remove asterisks used for emphasis *text* -> text
                s = s.replace(/\*([^*\n]+)\*/g, '$1');

                // Remove standalone asterisks
                s = s.replace(/\*+/g, '');

                return s.trim();
            };

            const newCt = clean(ct);
            const newCo = clean(co);

            if (newCt !== ct || newCo !== co) {
                // Don't set empty strings - keep original if cleaned is empty
                await client.query(`
                    UPDATE "Chapter" 
                    SET "contentTranslated" = $1,
                        "contentOriginal" = $2
                    WHERE id = $3
                `, [newCt || ct, newCo || co, ch.id]);
                fixed++;
            }
        }

        console.log(`✅ Fixed ${fixed} chapters`);

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
