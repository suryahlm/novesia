// Script untuk filter novel yang belum ada di database
// Jalankan: node filter-new-novels.cjs

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();

    try {
        // Get existing novels from database
        const result = await client.query('SELECT title FROM "Novel"');
        const existingTitles = result.rows.map(r => r.title.toLowerCase().trim());
        console.log(`📚 Existing novels in database: ${existingTitles.length}`);
        existingTitles.forEach(t => console.log(`  - ${t}`));

        // Load trending completed free novels
        const trendingNovels = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'trending-completed-free.json'), 'utf8')
        );
        console.log(`\n📖 Trending Completed Free: ${trendingNovels.length}`);

        // Filter out existing
        const newNovels = trendingNovels.filter(n => {
            const titleLower = n.title.toLowerCase().trim();
            // Check if already exists (partial match too)
            const exists = existingTitles.some(existing =>
                existing.includes(titleLower) || titleLower.includes(existing)
            );
            return !exists;
        });

        console.log(`\n✨ NEW novels (not in database): ${newNovels.length}\n`);

        console.log('=== New Novels to Scrape ===\n');
        newNovels.slice(0, 30).forEach((n, i) => {
            console.log(`${i + 1}. ${n.title}`);
            console.log(`   Chapters: ${n.chaptersCount} | Genres: ${n.genres.join(', ')}`);
            console.log(`   URL: ${n.novelUrl}`);
            console.log('');
        });

        if (newNovels.length > 30) {
            console.log(`... and ${newNovels.length - 30} more`);
        }

        // Save filtered list
        fs.writeFileSync(
            path.join(__dirname, 'new-novels-to-scrape.json'),
            JSON.stringify(newNovels, null, 2)
        );
        console.log(`\n✅ Saved ${newNovels.length} NEW novels to new-novels-to-scrape.json`);

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
