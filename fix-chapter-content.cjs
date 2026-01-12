// Script untuk menghapus teks sampah dari konten chapter
// Jalankan: node fix-chapter-content.cjs

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Patterns to remove from beginning of content
const JUNK_PATTERNS = [
    /^Temukan lebih banyak[^.]*\n*/gi,  // Ad text
    /^\*\*Bab \d+[:\s][^*]*\*\*\s*\n*/gi,  // **Bab X: Title**
    /^Teh Hijau[^\n]*\n*/gi,  // Teh Hijau spam
    /^TehKendaraan[^\n]*\n*/gi,
    /^kendaraanTeh[^\n]*\n*/gi,
];

async function main() {
    const client = await pool.connect();

    try {
        console.log("🔍 Mencari chapter dengan teks sampah...\n");

        // Find chapters with junk text
        const result = await client.query(`
            SELECT id, title, "contentTranslated"
            FROM "Chapter" 
            WHERE "contentTranslated" IS NOT NULL 
            AND (
                "contentTranslated" ILIKE 'Temukan lebih banyak%'
                OR "contentTranslated" ILIKE '**Bab %'
                OR "contentTranslated" ILIKE 'Teh Hijau%'
            )
        `);

        console.log(`📚 Ditemukan ${result.rows.length} chapter dengan teks sampah\n`);

        if (result.rows.length === 0) {
            console.log("✅ Tidak ada yang perlu diperbaiki!");
            return;
        }

        // Show samples
        console.log("Contoh yang akan diperbaiki:");
        result.rows.slice(0, 5).forEach(ch => {
            const preview = ch.contentTranslated.substring(0, 100).replace(/\n/g, ' ');
            console.log(`  [${ch.title}]: "${preview}..."`);
        });

        if (!process.argv.includes('--confirm')) {
            console.log(`\n⚠️ Jalankan: node fix-chapter-content.cjs --confirm`);
            return;
        }

        console.log("\n🔧 Membersihkan konten...\n");

        let fixed = 0;
        for (const ch of result.rows) {
            let content = ch.contentTranslated;

            // Remove junk patterns
            for (const pattern of JUNK_PATTERNS) {
                content = content.replace(pattern, '');
            }

            // Remove repeated "Temukan lebih banyak" anywhere
            content = content.replace(/Temukan lebih banyak[^\n]*\n*/gi, '');

            // Trim whitespace
            content = content.trim();

            if (content !== ch.contentTranslated) {
                await client.query(
                    'UPDATE "Chapter" SET "contentTranslated" = $1 WHERE id = $2',
                    [content, ch.id]
                );
                fixed++;
            }
        }

        console.log(`✅ Selesai! ${fixed} chapter dibersihkan`);

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
