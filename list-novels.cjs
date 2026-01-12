// Script untuk cek semua novel
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT id, title, "isManual", "createdAt"
            FROM "Novel" 
            ORDER BY "createdAt" DESC
        `);
        console.log(`Total: ${result.rows.length} novel\n`);
        result.rows.forEach((n, i) => {
            console.log(`${i + 1}. [${n.isManual ? 'MANUAL' : 'SCRAPED'}] ${n.title} - ${new Date(n.createdAt).toLocaleString()}`);
        });
    } finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
