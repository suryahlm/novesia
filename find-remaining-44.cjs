// Create target list for remaining novels (not yet scraped)
require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const allNovels = require('./trending-completed-free.json');
const alreadyTargeted = require('./target-novels.json');

async function main() {
    console.log('🔍 Finding remaining novels to scrape...\n');

    // Get already scraped from DB
    const dbResult = await pool.query(`
        SELECT title FROM "Novel" WHERE "sourceUrl" LIKE '%asianovel.net%'
    `);
    const dbTitles = dbResult.rows.map(r => r.title);

    // Get already targeted
    const targetedIds = alreadyTargeted.map(t => t.storyId);

    // Filter remaining
    const remaining = allNovels.filter(n =>
        !targetedIds.includes(n.storyId) &&
        !dbTitles.includes(n.title)
    );

    console.log(`📚 Total free & complete: ${allNovels.length}`);
    console.log(`✅ Already targeted/scraped: ${alreadyTargeted.length}`);
    console.log(`📋 Remaining to scrape: ${remaining.length}\n`);

    // Calculate total chapters
    const totalCh = remaining.reduce((sum, n) => sum + n.chaptersCount, 0);
    console.log(`📖 Total chapters: ${totalCh}\n`);

    // List them
    remaining.forEach((n, i) => console.log(`${i + 1}. ${n.title} (${n.chaptersCount} ch)`));

    // Save to file
    fs.writeFileSync('remaining-44-novels.json', JSON.stringify(remaining, null, 2));
    console.log('\n📁 Saved to remaining-44-novels.json');

    await pool.end();
}

main();
