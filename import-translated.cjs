// Import Translated Novel from JSON Batches
// Run: node import-translated.cjs <novel-slug>

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const novelSlug = process.argv[2];

    if (!novelSlug) {
        console.log('Usage: node import-translated.cjs <novel-slug>');
        console.log('\nThis will import *_ID.json files from exports/<novel-slug>/');
        await pool.end();
        return;
    }

    const exportDir = path.join(__dirname, 'exports', novelSlug);

    if (!fs.existsSync(exportDir)) {
        console.log(`❌ Export directory not found: exports/${novelSlug}/`);
        await pool.end();
        return;
    }

    console.log(`📥 Importing translations for: ${novelSlug}\n`);

    // Get novel
    const novelRes = await pool.query(
        'SELECT id, title FROM "Novel" WHERE slug = $1',
        [novelSlug]
    );

    if (novelRes.rows.length === 0) {
        console.log('❌ Novel not found in database');
        await pool.end();
        return;
    }

    const novel = novelRes.rows[0];
    console.log(`📖 Novel: ${novel.title}\n`);

    // Find translated files (*_ID.json)
    const files = fs.readdirSync(exportDir)
        .filter(f => f.endsWith('_ID.json'))
        .sort();

    if (files.length === 0) {
        console.log('❌ No translated files found (*_ID.json)');
        console.log('   Make sure to save translated files with _ID suffix');
        await pool.end();
        return;
    }

    console.log(`📁 Found ${files.length} translated files\n`);

    let updated = 0;
    let failed = 0;

    for (const file of files) {
        console.log(`📄 Processing: ${file}`);

        try {
            const filepath = path.join(exportDir, file);
            const content = fs.readFileSync(filepath, 'utf8');
            const chapters = JSON.parse(content);

            for (const ch of chapters) {
                try {
                    const result = await pool.query(
                        `UPDATE "Chapter" 
                         SET "contentTranslated" = $1, "updatedAt" = NOW() 
                         WHERE "novelId" = $2 AND "chapterNumber" = $3
                         RETURNING id`,
                        [ch.content, novel.id, ch.number]
                    );

                    if (result.rows.length > 0) {
                        updated++;
                        process.stdout.write('✓');
                    } else {
                        process.stdout.write('?');
                    }
                } catch (err) {
                    failed++;
                    process.stdout.write('✗');
                }
            }
            console.log();

        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`   Updated: ${updated} chapters`);
    console.log(`   Failed: ${failed} chapters`);

    // Update novel language to Indonesian
    if (updated > 0 && failed === 0) {
        await pool.query(
            'UPDATE "Novel" SET language = $1, "updatedAt" = NOW() WHERE id = $2',
            ['id', novel.id]
        );
        console.log(`\n📘 Novel language changed to Indonesian!`);
        console.log(`   Novel now appears on main page instead of English Novels page.`);
    }

    await pool.end();
}

main().catch(console.error);
