// Create list of remaining novels to scrape
require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const allTargets = require('./target-novels.json');

async function main() {
    console.log('🔍 Finding remaining novels to scrape...\n');

    // Get already scraped novels
    const result = await pool.query(`
        SELECT title FROM "Novel" 
        WHERE "sourceUrl" LIKE '%asianovel.net%'
    `);

    const scrapedTitles = result.rows.map(r => r.title);
    console.log(`✅ Already scraped: ${scrapedTitles.length} novels`);

    // Filter out already scraped
    const remaining = allTargets.filter(t => !scrapedTitles.includes(t.title));
    console.log(`📋 Remaining to scrape: ${remaining.length} novels\n`);

    // List remaining
    remaining.forEach(n => console.log(`   - ${n.title} (${n.chaptersCount} ch)`));

    // Save to file
    fs.writeFileSync('remaining-novels.json', JSON.stringify(remaining, null, 2));
    console.log('\n📁 Saved to remaining-novels.json');

    await pool.end();
}

main();
