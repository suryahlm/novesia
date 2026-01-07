const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const cuid = require("cuid");
require("dotenv").config();

// Use DIRECT_URL for direct connection
const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
});

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

// Main import function
async function importNovels() {
    console.log("=".repeat(60));
    console.log("IMPORT TRANSLATED NOVELS TO DATABASE");
    console.log("=".repeat(60));
    console.log(`Started at: ${new Date().toLocaleString()}`);

    const client = await pool.connect();

    try {
        // Get translated novel files
        const novelFiles = fs.readdirSync(TRANSLATED_DIR).filter((f) => f.endsWith(".json"));
        console.log(`Found ${novelFiles.length} translated novels\n`);

        let totalNovels = 0;
        let totalChapters = 0;

        for (const file of novelFiles) {
            const novelPath = path.join(TRANSLATED_DIR, file);
            console.log(`\n${"=".repeat(60)}`);
            console.log(`Processing: ${file}`);

            try {
                // Load novel data
                const novelData = JSON.parse(fs.readFileSync(novelPath, "utf8"));
                const title = novelData.title || file.replace(".json", "");
                const slug = generateSlug(title);
                const chapters = novelData.chapters || [];

                console.log(`  Title: ${title}`);
                console.log(`  Slug: ${slug}`);
                console.log(`  Chapters: ${chapters.length}`);

                // Check if novel exists
                const existingNovel = await client.query(
                    'SELECT id FROM "Novel" WHERE slug = $1',
                    [slug]
                );

                let novelId;

                if (existingNovel.rows.length > 0) {
                    novelId = existingNovel.rows[0].id;
                    console.log(`  Novel exists (${novelId}), updating chapters...`);

                    // Update novel
                    await client.query(
                        `UPDATE "Novel" SET 
                            title = $1, 
                            synopsis = $2, 
                            cover = $3, 
                            author = $4, 
                            "updatedAt" = NOW() 
                        WHERE id = $5`,
                        [
                            title,
                            novelData.synopsis || novelData.description || "",
                            novelData.cover || novelData.coverImage || "",
                            novelData.author || "Unknown",
                            novelId
                        ]
                    );
                } else {
                    console.log(`  Creating new novel...`);
                    novelId = cuid();
                    const insertResult = await client.query(
                        `INSERT INTO "Novel" (id, title, slug, synopsis, cover, author, status, "createdAt", "updatedAt")
                         VALUES ($1, $2, $3, $4, $5, $6, 'ONGOING', NOW(), NOW())
                         RETURNING id`,
                        [
                            novelId,
                            title,
                            slug,
                            novelData.synopsis || novelData.description || "",
                            novelData.cover || novelData.coverImage || "",
                            novelData.author || "Unknown"
                        ]
                    );
                    console.log(`  Created novel (${novelId})`);
                }

                // Import chapters
                let importedCount = 0;
                for (let i = 0; i < chapters.length; i++) {
                    const chapter = chapters[i];
                    const chapterNumber = i + 1;
                    const chapterTitle = chapter.title || `Chapter ${chapterNumber}`;

                    // Check if chapter exists
                    const existingChapter = await client.query(
                        'SELECT id FROM "Chapter" WHERE "novelId" = $1 AND "chapterNumber" = $2',
                        [novelId, chapterNumber]
                    );

                    if (existingChapter.rows.length > 0) {
                        // Update existing chapter
                        await client.query(
                            `UPDATE "Chapter" SET 
                                title = $1, 
                                "contentTranslated" = $2, 
                                "contentOriginal" = $3, 
                                "updatedAt" = NOW() 
                            WHERE id = $4`,
                            [
                                chapterTitle,
                                chapter.content || "",
                                chapter.contentOriginal || "",
                                existingChapter.rows[0].id
                            ]
                        );
                    } else {
                        // Create new chapter
                        const chapterId = cuid();
                        await client.query(
                            `INSERT INTO "Chapter" (id, "novelId", "chapterNumber", title, "contentTranslated", "contentOriginal", "isPremium", "coinCost", "createdAt", "updatedAt")
                             VALUES ($1, $2, $3, $4, $5, $6, false, 0, NOW(), NOW())`,
                            [
                                chapterId,
                                novelId,
                                chapterNumber,
                                chapterTitle,
                                chapter.content || "",
                                chapter.contentOriginal || ""
                            ]
                        );
                    }

                    importedCount++;
                    if (importedCount % 50 === 0) {
                        console.log(`  Imported ${importedCount}/${chapters.length} chapters...`);
                    }
                }

                console.log(`  ✓ Novel imported with ${chapters.length} chapters`);
                totalNovels++;
                totalChapters += chapters.length;
            } catch (error) {
                console.error(`  ✗ Error importing novel:`, error.message);
            }
        }

        console.log(`\n${"=".repeat(60)}`);
        console.log("IMPORT COMPLETE");
        console.log(`  Novels: ${totalNovels}`);
        console.log(`  Chapters: ${totalChapters}`);
        console.log(`  Finished at: ${new Date().toLocaleString()}`);
        console.log("=".repeat(60));

    } finally {
        client.release();
        await pool.end();
    }
}

// Run
importNovels().catch(console.error);
