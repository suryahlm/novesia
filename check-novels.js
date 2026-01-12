const { Pool } = require('pg');
require('dotenv').config();

async function check() {
    const p = new Pool({ connectionString: process.env.DATABASE_URL });

    // Check novels created in last hour
    const result = await p.query(`
    SELECT COUNT(*) as total, "isPremium" 
    FROM "Novel" 
    WHERE "createdAt" > NOW() - INTERVAL '1 hour' 
    GROUP BY "isPremium"
  `);

    console.log('Novels created in last hour:');
    result.rows.forEach(row => {
        console.log(`  isPremium=${row.isPremium}: ${row.total}`);
    });

    // Check if any have coinCost > 0
    const coinResult = await p.query(`
    SELECT COUNT(*) as total, "coinCost"
    FROM "Novel" 
    WHERE "createdAt" > NOW() - INTERVAL '1 hour' 
    GROUP BY "coinCost"
  `);

    console.log('\nBy coinCost:');
    coinResult.rows.forEach(row => {
        console.log(`  coinCost=${row.coinCost}: ${row.total}`);
    });

    await p.end();
}

check();
