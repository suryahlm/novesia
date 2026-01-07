const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
});

// Novel metadata - complete information
const novels = [
    {
        slugPattern: "i-want-to-be-a-good-person%",
        title: "I Want To Be a Good Person in This Life",
        author: "汏姃",
        cover: "https://www.asianovel.net/wp-content/uploads/2022/05/9375s-c5a5e7a140ea4f63ad19a1044c25dc441.jpg",
        synopsis: `Wei Yin, yang mati di usia dua puluh tujuh tahun, terlahir kembali ke usia enam belas tahun.

Di kehidupan sebelumnya, ia adalah orang jahat yang egois dan kejam. Ia menyakiti banyak orang, termasuk keluarganya sendiri. Setelah kematiannya, ia menyesal dan berharap bisa hidup kembali sebagai orang baik.

Sekarang, dengan kesempatan kedua ini, Wei Yin bertekad untuk memperbaiki semua kesalahannya, memperlakukan orang-orang di sekitarnya dengan baik, dan menjalani hidup yang bermakna. Tapi bisakah seseorang yang dulunya jahat benar-benar berubah?`,
        status: "COMPLETED",
        genres: ["Drama", "Romance", "Slice of Life", "Psychological"]
    },
    {
        slugPattern: "burst%actor%",
        title: "Burst! the Actor Was Won By the Newcomer",
        author: "火鸟娱娱",
        cover: "https://www.asianovel.net/wp-content/uploads/2023/05/burst-actor-novel-cover.jpg",
        synopsis: `Qin Sheng, seorang aktor pendatang baru yang berbakat namun kurang dikenal, mendapat kesempatan emas untuk berperan dalam drama besar bersama aktor top, Lu Yanzhou.

Awalnya Lu Yanzhou meremehkan Qin Sheng, menganggapnya hanya aktor biasa yang tak akan bertahan lama di industri. Namun, semakin mereka berakting bersama, semakin Lu Yanzhou terkesan dengan kemampuan dan dedikasi Qin Sheng.

Dari hubungan senior-junior yang dingin, perlahan berkembang menjadi persahabatan, dan akhirnya... sesuatu yang lebih dalam. Ini adalah kisah tentang cinta, ambisi, dan bagaimana dua aktor menemukan chemistry yang tak tergantikan, baik di layar maupun di kehidupan nyata.`,
        status: "COMPLETED",
        genres: ["Romance", "Drama", "Showbiz", "Comedy"]
    },
    {
        slugPattern: "absolute-zero%",
        title: "Absolute Zero: The Rebellion of a Trash Ability",
        author: "墨小诺",
        cover: "https://www.asianovel.net/wp-content/uploads/2026/01/20251119212707_300_420.jpeg",
        synopsis: `Di dunia di mana setiap orang memiliki kemampuan supernatural, Su Chen terlahir dengan kemampuan yang dianggap paling tidak berguna: "Absolute Zero" - kemampuan untuk menurunkan suhu.

Semua orang mencemoohnya. Keluarganya membuangnya. Sekolahnya mengabaikannya. Tapi Su Chen tidak menyerah.

Melalui latihan keras dan tekad yang tak tergoyahkan, ia menemukan potensi tersembunyi dari kemampuannya yang "sampah" ini. Absolute Zero bukan hanya tentang dingin - ini tentang menghentikan segala sesuatu. Molekul. Waktu. Bahkan... kematian.

Ini adalah kisah kebangkitan seorang yang dianggap lemah menjadi salah satu yang terkuat. Sebuah balas dendam tanpa darah, di mana Su Chen membuktikan bahwa tak ada kemampuan yang benar-benar tidak berguna.`,
        status: "ONGOING",
        genres: ["Action", "Fantasy", "Supernatural", "Adventure"]
    }
];

async function updateNovels() {
    const client = await pool.connect();

    try {
        console.log("Updating novels with complete metadata...\n");

        for (const novel of novels) {
            console.log(`Processing: ${novel.title}`);

            // Get or create genres
            const genreIds = [];
            for (const genreName of novel.genres) {
                const genreSlug = genreName.toLowerCase().replace(/\s+/g, "-");

                // Upsert genre
                const genreResult = await client.query(
                    `INSERT INTO "Genre" (id, name, slug) 
                     VALUES ($1, $2, $3)
                     ON CONFLICT (slug) DO UPDATE SET name = $2
                     RETURNING id`,
                    [require("cuid")(), genreName, genreSlug]
                );
                genreIds.push(genreResult.rows[0].id);
            }

            // Update novel
            const updateResult = await client.query(
                `UPDATE "Novel" SET 
                    title = $1,
                    author = $2,
                    cover = $3,
                    synopsis = $4,
                    status = $5,
                    "updatedAt" = NOW()
                WHERE slug LIKE $6
                RETURNING id, slug`,
                [novel.title, novel.author, novel.cover, novel.synopsis, novel.status, novel.slugPattern]
            );

            if (updateResult.rows.length > 0) {
                const novelId = updateResult.rows[0].id;
                console.log(`  Updated novel: ${updateResult.rows[0].slug}`);

                // Connect genres to novel
                // First, disconnect existing genres
                await client.query(
                    `DELETE FROM "_GenreToNovel" WHERE "B" = $1`,
                    [novelId]
                );

                // Then connect new genres
                for (const genreId of genreIds) {
                    await client.query(
                        `INSERT INTO "_GenreToNovel" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [genreId, novelId]
                    );
                }
                console.log(`  Connected ${novel.genres.length} genres: ${novel.genres.join(", ")}`);
            } else {
                console.log(`  Novel not found with pattern: ${novel.slugPattern}`);
            }

            console.log("");
        }

        console.log("Done!");
    } finally {
        client.release();
        await pool.end();
    }
}

updateNovels().catch(console.error);
