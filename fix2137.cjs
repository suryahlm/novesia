const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL, ssl: { rejectUnauthorized: false } });

async function fixNovel2137() {
    const client = await pool.connect();
    try {
        // Update Novel 2137 with correct title
        const result = await client.query(`
            UPDATE "Novel" 
            SET title = 'Zombie King is on the hot search again with his cubs',
                author = '陆之然',
                status = 'COMPLETED',
                slug = 'zombie-king-is-on-the-hot-search-again-with-his-cubs'
            WHERE slug = 'novel-2137' OR title LIKE '%Novel 2137%'
            RETURNING id, title, author, status
        `);
        console.log("Updated:", result.rows[0]);
    } finally {
        client.release();
        await pool.end();
    }
}
fixNovel2137();
