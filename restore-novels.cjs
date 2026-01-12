// Script untuk restore novel dari file JSON backup
// Jalankan: node restore-novels.cjs

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const cuid = () => 'c' + Array(24).fill(0).map(() => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const DATA_DIR = path.join(__dirname, 'scraper-data', 'data', 'translated', 'novels');

async function main() {
    const client = await pool.connect();

    try {
        console.log("🔍 Mencari file JSON di:", DATA_DIR);

        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
        console.log(`📚 Ditemukan ${files.length} file\n`);

        if (!process.argv.includes('--confirm')) {
            files.forEach((f, i) => console.log(`${i + 1}. ${f}`));
            console.log("\n⚠️ Jalankan: node restore-novels.cjs --confirm");
            return;
        }

        let totalNovels = 0, totalChapters = 0;

        for (const file of files) {
            try {
                console.log(`\n📖 Processing: ${file}`);
                const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));

                // Check structure
                if (!data.title || !data.chapters) {
                    console.log("  ⏭️ Skip - format tidak sesuai");
                    continue;
                }

                // Create novel
                const novelId = cuid();
                const slug = slugify(data.title);

                // Check if exists
                const exists = await client.query('SELECT id FROM "Novel" WHERE slug = $1', [slug]);
                if (exists.rows.length > 0) {
                    console.log(`  ⏭️ Skip - novel sudah ada: ${data.title}`);
                    continue;
                }

                // Normalize status to uppercase
                let status = (data.status || 'ONGOING').toUpperCase();
                if (!['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED'].includes(status)) {
                    status = 'ONGOING';
                }

                await client.query(`
                    INSERT INTO "Novel" (id, title, slug, synopsis, cover, author, status, "sourceUrl", "isManual", "totalViews", "avgRating", "ratingCount", "isPremium", "coinCost", "freeChapterLimit", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 0, 0, 0, false, 5, 0, NOW(), NOW())
                `, [novelId, data.title, slug, data.synopsis || '', data.cover || '', data.author || 'Unknown', status, data.sourceUrl || '']);

                console.log(`  ✓ Novel created: ${data.title}`);
                totalNovels++;

                // Create chapters
                let chaptersCreated = 0;
                for (const chapter of data.chapters) {
                    const chapterId = cuid();
                    const wordCount = (chapter.translated || chapter.content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;

                    await client.query(`
                        INSERT INTO "Chapter" (id, "novelId", "chapterNumber", title, "contentOriginal", "contentTranslated", "wordCount", "isPremium", "coinCost", views, "sourceUrl", "createdAt", "updatedAt")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, false, 0, 0, $8, NOW(), NOW())
                    `, [chapterId, novelId, chapter.number || chaptersCreated + 1, chapter.title || `Chapter ${chaptersCreated + 1}`, chapter.content || '', chapter.translated || '', wordCount, chapter.url || '']);

                    chaptersCreated++;
                }
                console.log(`  ✓ ${chaptersCreated} chapters created`);
                totalChapters += chaptersCreated;

            } catch (err) {
                console.log(`  ❌ Error: ${err.message}`);
            }
        }

        console.log(`\n✅ SELESAI! ${totalNovels} novels, ${totalChapters} chapters restored`);

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
