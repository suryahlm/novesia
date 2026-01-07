/**
 * Import translated novels to R2 + Database
 * Uploads covers to R2 and inserts novel data to Postgres
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// Database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// R2 Configuration
const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});
const R2_BUCKET = process.env.R2_BUCKET_NAME || "novesia-assets";

// Directories
const TRANSLATED_DIR = "./scraper-data/data/translated/novels";

// Helper: Generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 100);
}

// Helper: Upload cover to R2
async function uploadCoverToR2(coverUrl, slug) {
    try {
        const response = await fetch(coverUrl);
        if (!response.ok) return null;

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : "jpg";
        const key = `covers/${slug}.${ext}`;

        await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }));

        return `https://novesia.vercel.app/api/cdn/${key}`;
    } catch (error) {
        console.error(`  Failed to upload cover:`, error.message);
        return coverUrl;
    }
}

// Helper: Get or create genres
async function getOrCreateGenres(client, genreNames) {
    const genreIds = [];
    for (const name of genreNames) {
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        let result = await client.query('SELECT id FROM "Genre" WHERE slug = $1', [slug]);
        if (result.rows.length === 0) {
            result = await client.query(
                'INSERT INTO "Genre" (id, name, slug) VALUES (gen_random_uuid(), $1, $2) RETURNING id',
                [name, slug]
            );
        }
        genreIds.push(result.rows[0].id);
    }
    return genreIds;
}

// Main import function
async function importNovels() {
    console.log("=".repeat(60));
    console.log("IMPORTING NOVELS TO R2 + DATABASE");
    console.log("=".repeat(60));

    const client = await pool.connect();

    try {
        const files = fs.readdirSync(TRANSLATED_DIR).filter(f => f.endsWith(".json"));
        console.log(`Found ${files.length} translated novels\n`);

        let imported = 0, skipped = 0, errors = 0;

        for (const file of files) {
            const filePath = path.join(TRANSLATED_DIR, file);
            console.log(`\nProcessing: ${file}`);

            try {
                const novelData = JSON.parse(fs.readFileSync(filePath, "utf8"));
                const title = novelData.title || file.replace(".json", "");
                const slug = generateSlug(title);

                // Check if already exists
                const existing = await client.query('SELECT id FROM "Novel" WHERE slug = $1', [slug]);
                if (existing.rows.length > 0) {
                    console.log(`  ⏭ Already exists, skipping`);
                    skipped++;
                    continue;
                }

                // Upload cover to R2
                console.log(`  📸 Uploading cover...`);
                let coverUrl = novelData.cover || novelData.coverUrl || "";
                if (coverUrl) {
                    coverUrl = await uploadCoverToR2(coverUrl, slug);
                }

                // Get or create genres
                const genres = novelData.genres || [];
                const genreIds = await getOrCreateGenres(client, genres);

                // Insert novel - matching exact Prisma schema
                console.log(`  📖 Inserting novel...`);
                const novelResult = await client.query(`
                    INSERT INTO "Novel" (
                        id, title, slug, synopsis, cover, author, status,
                        "totalViews", "avgRating", "ratingCount", "createdAt", "updatedAt"
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 0, 0, 0, NOW(), NOW()
                    ) RETURNING id
                `, [
                    title,
                    slug,
                    novelData.synopsis || novelData.description || "",
                    coverUrl || null,
                    novelData.author || "Unknown",
                    novelData.status === "completed" ? "COMPLETED" : "ONGOING"
                ]);

                const novelId = novelResult.rows[0].id;

                // Link genres
                for (const genreId of genreIds) {
                    await client.query(`
                        INSERT INTO "_GenreToNovel" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING
                    `, [genreId, novelId]);
                }

                // Insert chapters - matching exact Prisma schema
                const chapters = novelData.chapters || [];
                console.log(`  📝 Inserting ${chapters.length} chapters...`);

                for (let i = 0; i < chapters.length; i++) {
                    const ch = chapters[i];
                    const chapterNum = i + 1;
                    const chapterTitle = ch.title || `Chapter ${chapterNum}`;
                    const content = ch.content || "";
                    const originalContent = ch.contentOriginal || "";

                    await client.query(`
                        INSERT INTO "Chapter" (
                            id, "novelId", "chapterNumber", title, "contentOriginal", "contentTranslated",
                            "wordCount", "createdAt", "updatedAt"
                        ) VALUES (
                            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
                        )
                    `, [
                        novelId,
                        chapterNum,
                        chapterTitle,
                        originalContent || null,
                        content,
                        content.split(/\s+/).length
                    ]);
                }

                console.log(`  ✅ Imported: ${title}`);
                imported++;

            } catch (error) {
                console.error(`  ❌ Error:`, error.message);
                errors++;
            }
        }

        console.log("\n" + "=".repeat(60));
        console.log("IMPORT COMPLETE");
        console.log(`  Imported: ${imported}`);
        console.log(`  Skipped: ${skipped}`);
        console.log(`  Errors: ${errors}`);
        console.log("=".repeat(60));

    } finally {
        client.release();
        await pool.end();
    }
}

importNovels().catch(console.error);
