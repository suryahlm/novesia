// Export Novel to JSON Batches for Translation
// Run: node export-novel.cjs <novel-slug> [chapters-per-batch]

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const novelSlug = process.argv[2];
    const batchSize = parseInt(process.argv[3]) || 10;

    if (!novelSlug) {
        // List available English novels
        const novels = await pool.query(`
            SELECT slug, title, 
                   (SELECT COUNT(*) FROM "Chapter" WHERE "novelId" = "Novel".id) as chapters
            FROM "Novel" 
            WHERE language = 'en'
            ORDER BY chapters DESC
        `);

        console.log('📚 English Novels available for export:\n');
        novels.rows.forEach(n => console.log(`   ${n.slug} (${n.chapters} ch)`));
        console.log('\nUsage: node export-novel.cjs <novel-slug> [chapters-per-batch]');
        console.log('Default: 10 chapters per batch');
        await pool.end();
        return;
    }

    console.log(`📦 Exporting: ${novelSlug}`);
    console.log(`📄 Batch size: ${batchSize} chapters per file\n`);

    // Get novel
    const novelRes = await pool.query(
        'SELECT id, title, slug FROM "Novel" WHERE slug = $1',
        [novelSlug]
    );

    if (novelRes.rows.length === 0) {
        console.log('❌ Novel not found');
        await pool.end();
        return;
    }

    const novel = novelRes.rows[0];
    console.log(`📖 Novel: ${novel.title}\n`);

    // Get chapters
    const chaptersRes = await pool.query(
        'SELECT "chapterNumber", title, "contentOriginal" FROM "Chapter" WHERE "novelId" = $1 ORDER BY "chapterNumber"',
        [novel.id]
    );

    const chapters = chaptersRes.rows;
    console.log(`📄 Total chapters: ${chapters.length}`);

    // Create export directory
    const exportDir = path.join(__dirname, 'exports', novel.slug);
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    // Split into batches
    const batches = [];
    for (let i = 0; i < chapters.length; i += batchSize) {
        batches.push(chapters.slice(i, i + batchSize));
    }

    console.log(`📁 Creating ${batches.length} batch files...\n`);

    // Export each batch
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const startCh = batch[0].chapterNumber;
        const endCh = batch[batch.length - 1].chapterNumber;
        const filename = `batch-${String(i + 1).padStart(2, '0')}_ch-${String(startCh).padStart(3, '0')}-${String(endCh).padStart(3, '0')}.json`;

        const batchData = batch.map(ch => ({
            number: ch.chapterNumber,
            title: ch.title,
            content: ch.contentOriginal
        }));

        const filepath = path.join(exportDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(batchData, null, 2));
        console.log(`   ✅ ${filename} (${batch.length} chapters)`);
    }

    // Create metadata file
    const metadata = {
        novelSlug: novel.slug,
        novelTitle: novel.title,
        totalChapters: chapters.length,
        batchSize: batchSize,
        totalBatches: batches.length,
        exportedAt: new Date().toISOString(),
        instructions: [
            "1. Open each batch-XX.json file",
            "2. Copy the content array to Gemini",
            "3. Prompt: 'Translate the content field of each chapter to Indonesian. Keep HTML tags and structure intact. Return the same JSON format.'",
            "4. Save result as batch-XX_ID.json",
            "5. Run: node import-translated.cjs " + novel.slug
        ]
    };

    fs.writeFileSync(path.join(exportDir, '_metadata.json'), JSON.stringify(metadata, null, 2));

    console.log(`\n🎉 Export complete!`);
    console.log(`📂 Location: exports/${novel.slug}/`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Open batch files in exports/${novel.slug}/`);
    console.log(`   2. Translate in Gemini`);
    console.log(`   3. Save as *_ID.json`);
    console.log(`   4. Run: node import-translated.cjs ${novel.slug}`);

    await pool.end();
}

main().catch(console.error);
