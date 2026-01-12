// Script untuk menghapus novel yang di-scrape
// Jalankan: node delete-scraped-novels.cjs

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    const client = await pool.connect();

    try {
        console.log("🔍 Mencari novel yang di-scrape (punya sourceUrl)...\n");

        // Cari novel yang di-scrape (isManual = false) atau dibuat dalam 7 hari terakhir
        const result = await client.query(`
            SELECT id, title, "isManual", "createdAt"
            FROM "Novel" 
            WHERE "isManual" = false
            ORDER BY "createdAt" DESC
        `);

        console.log(`📚 Ditemukan ${result.rows.length} novel hasil scraping:\n`);

        result.rows.forEach((novel, i) => {
            console.log(`${i + 1}. ${novel.title}`);
        });

        if (result.rows.length === 0) {
            console.log("\n❌ Tidak ada novel hasil scraping untuk dihapus.");
            return;
        }

        if (!process.argv.includes('--confirm')) {
            console.log("\n⚠️ PERINGATAN: Akan menghapus semua novel di atas beserta chapter-nya!");
            console.log("Jalankan: node delete-scraped-novels.cjs --confirm\n");
            return;
        }

        console.log("\n🗑️ Menghapus...\n");

        const novelIds = result.rows.map(n => n.id);

        // Hapus chapters dulu
        const deleteChapters = await client.query(`
            DELETE FROM "Chapter" WHERE "novelId" = ANY($1)
        `, [novelIds]);
        console.log(`✓ ${deleteChapters.rowCount} chapters dihapus`);

        // Hapus novels
        const deleteNovels = await client.query(`
            DELETE FROM "Novel" WHERE id = ANY($1)
        `, [novelIds]);
        console.log(`✓ ${deleteNovels.rowCount} novels dihapus`);

        console.log("\n✅ Selesai!");

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
