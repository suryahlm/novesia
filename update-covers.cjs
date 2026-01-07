const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
});

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-d7fdf7a6932b4febbd724bd48ae0c2c3.r2.dev";

async function updateCovers() {
    const client = await pool.connect();

    try {
        // Update covers for novels with slugs containing the IDs
        const updates = [
            { pattern: "i-want-to-be-a-good-person%", novelId: "1290" },
            { pattern: "burst%actor%", novelId: "1708" },
            { pattern: "absolute-zero%", novelId: "3564" },
        ];

        for (const update of updates) {
            const coverUrl = `${R2_PUBLIC_URL}/covers/${update.novelId}.jpg`;
            const result = await client.query(
                `UPDATE "Novel" SET cover = $1 WHERE slug LIKE $2 RETURNING id, title, cover`,
                [coverUrl, update.pattern]
            );

            if (result.rows.length > 0) {
                console.log(`✓ Updated: ${result.rows[0].title}`);
                console.log(`  Cover: ${result.rows[0].cover}\n`);
            }
        }

        console.log("Done!");
    } finally {
        client.release();
        await pool.end();
    }
}

updateCovers().catch(console.error);
