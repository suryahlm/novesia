// Script untuk menghapus "Chapter X" dari judul chapter
// Jalankan: node fix-chapter-titles.cjs

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();

    try {
        console.log("🔍 Mencari chapter dengan judul duplikat 'Chapter X'...\n");

        // Find chapters with "Chapter X" in title
        const result = await client.query(`
            SELECT id, title, "chapterNumber"
            FROM "Chapter" 
            WHERE title ~* '^chapter\\s*\\d+'
            ORDER BY "chapterNumber"
        `);

        console.log(`📚 Ditemukan ${result.rows.length} chapter dengan "Chapter X" di judul\n`);

        if (result.rows.length === 0) {
            console.log("✅ Tidak ada yang perlu diperbaiki!");
            return;
        }

        // Show samples
        console.log("Contoh yang akan diperbaiki:");
        result.rows.slice(0, 10).forEach(ch => {
            const newTitle = ch.title.replace(/^chapter\s*\d+\s*[:\-\.]?\s*/i, '').trim() || `Bab ${ch.chapterNumber}`;
            console.log(`  "${ch.title}" → "${newTitle}"`);
        });

        if (!process.argv.includes('--confirm')) {
            console.log(`\n⚠️ Jalankan: node fix-chapter-titles.cjs --confirm`);
            return;
        }

        console.log("\n🔧 Memperbaiki judul...\n");

        let fixed = 0;
        for (const ch of result.rows) {
            // Remove "Chapter X" or "Chapter X:" or "Chapter X -" from beginning
            let newTitle = ch.title.replace(/^chapter\s*\d+\s*[:\-\.]?\s*/i, '').trim();

            // If empty after removal, use "Bab X"
            if (!newTitle) {
                newTitle = `Bab ${ch.chapterNumber}`;
            }

            await client.query(
                'UPDATE "Chapter" SET title = $1 WHERE id = $2',
                [newTitle, ch.id]
            );
            fixed++;
        }

        console.log(`✅ Selesai! ${fixed} judul chapter diperbaiki`);

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
