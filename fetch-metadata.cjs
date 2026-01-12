// Script untuk fetch metadata (synopsis, genres) dari asianovel.net
// Jalankan: node fetch-metadata.cjs

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Novel IDs from asianovel.net and their DB slugs
const NOVELS = [
    { slug: "oops-read-your-mind", asianId: "3538-Oops--Read-Your-Mind-" },
    { slug: "after-transmigrating-into-a-green-tea-i-became-the-groups-darling", asianId: "3342-After-Transmigrating-Into-a-Green-Tea--I-Became-th" },
    { slug: "i-want-to-be-a-good-person-in-this-life", asianId: "1290-I-Want-To-Be-a-Good-Person-in-This-Life" },
    { slug: "burst-the-actor-was-won-by-the-newcomer", asianId: "1708-Burst--the-Actor-Was-Won-By-the-Newcomer" },
    { slug: "zombie-king-is-on-the-hot-search-again-with-his-cubs", asianId: "2137-Zombie-King-is-on-the-hot-search-again-with-his-cu" },
];

// Map of common genres from asianovel to our DB genres
const GENRE_MAP = {
    "action": "Action",
    "adventure": "Adventure",
    "comedy": "Comedy",
    "drama": "Drama",
    "fantasy": "Fantasy",
    "horror": "Horror",
    "mystery": "Mystery",
    "psychological": "Psychological",
    "romance": "Romance",
    "school life": "School Life",
    "sci-fi": "Sci-Fi",
    "seinen": "Seinen",
    "shoujo": "Shoujo",
    "shounen": "Shounen",
    "slice of life": "Slice of Life",
    "sports": "Sports",
    "supernatural": "Supernatural",
    "tragedy": "Tragedy",
    "wuxia": "Wuxia",
    "xianxia": "Xianxia",
    "xuanhuan": "Xuanhuan",
    "yaoi": "Yaoi",
    "yuri": "Yuri",
    "historical": "Historical",
    "martial arts": "Martial Arts",
    "mecha": "Mecha",
    "mature": "Mature",
    "harem": "Harem",
    "cultivation": "Cultivation",
    "bl": "BL",
    "boys love": "BL",
    "shounen ai": "BL",
    "shoujo ai": "GL",
    "gl": "GL",
    "girls love": "GL",
    "transmigration": "Transmigration",
    "reincarnation": "Reincarnation",
    "josei": "Josei",
};

async function main() {
    const client = await pool.connect();

    try {
        console.log("🔍 Checking novels without synopsis...\n");

        // Find novels with empty synopsis
        const result = await client.query(`
            SELECT id, title, slug, synopsis
            FROM "Novel" 
            WHERE synopsis IS NULL OR synopsis = ''
        `);

        console.log(`Found ${result.rows.length} novels without synopsis\n`);

        result.rows.forEach(n => console.log(`- ${n.title}`));

        // Get all genres from DB
        const genresResult = await client.query('SELECT id, name FROM "Genre"');
        const dbGenres = {};
        genresResult.rows.forEach(g => {
            dbGenres[g.name.toLowerCase()] = g.id;
        });
        console.log(`\nDB has ${Object.keys(dbGenres).length} genres`);

        console.log("\n⚠️ Synopsis dan genres tidak ada di backup JSON.");
        console.log("Untuk mengisi data ini, Anda perlu:");
        console.log("1. Scrape ulang dari asianovel.net");
        console.log("2. Atau isi manual di admin panel");

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
