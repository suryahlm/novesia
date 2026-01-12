// Auto Scraper V2 - Batch 30 Novels
// Features: Image download, Metadata sync, Chapter loop
// Run: node auto-scrape-v2.cjs

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { Pool } = require('pg');
const { Readable } = require('stream');
const { completed } = require('stream');

const cookies = require('./asianovel-cookies.cjs');
const targets = require('./target-novels.json');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Ensure directories
const coversDir = path.join(__dirname, 'public', 'covers');
if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
}

// Fetch helper with retry
async function fetchPage(url, retries = 3) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
                'Cookie': cookies.cookieString,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Priority': 'u=0, i',
                'Cache-Control': 'max-age=0',
            }
        });

        if (response.status === 403) {
            throw new Error('403 Forbidden - Cookie might be expired');
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
    } catch (err) {
        if (retries > 0) {
            console.log(`   ⚠️ Error: ${err.message}. Retrying in 5s...`);
            await delay(5000);
            return fetchPage(url, retries - 1);
        }
        throw err;
    }
}

// Download image
async function downloadCover(url, filename) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);

        const buffer = await response.arrayBuffer();
        const savePath = path.join(coversDir, filename);
        fs.writeFileSync(savePath, Buffer.from(buffer));
        return `/covers/${filename}`;
    } catch (err) {
        console.error(`   ❌ Failed to download cover: ${err.message}`);
        return null;
    }
}

// Scrape Single Novel
async function processNovel(novelData) {
    console.log(`\n📚 Processing: ${novelData.title} (ID: ${novelData.storyId})`);

    try {
        // 1. Fetch Metadata Page
        const html = await fetchPage(novelData.novelUrl);
        const $ = cheerio.load(html);

        // 2. Download Cover
        const coverFilename = `novel_${novelData.storyId}.jpg`;
        const localCoverPath = await downloadCover(novelData.coverUrl, coverFilename);

        // 3. Extract Full Data
        const fullSynopsis = $('.story__summary .fictioneer-content').text().trim() || novelData.synopsis;
        const author = $('.story__author a').first().text().trim() || novelData.author;

        // 4. Upsert Novel to DB
        const slug = novelData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const insertNovelQuery = `
            INSERT INTO "Novel" (title, slug, author, synopsis, "coverUrl", status, "sourceUrl")
            VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6)
            ON CONFLICT (title) DO UPDATE SET
                "coverUrl" = EXCLUDED."coverUrl",
                synopsis = EXCLUDED.synopsis,
                "sourceUrl" = EXCLUDED."sourceUrl"
            RETURNING id;
        `;

        const novelRes = await pool.query(insertNovelQuery, [
            novelData.title,
            slug,
            author,
            fullSynopsis,
            localCoverPath || novelData.coverUrl,
            novelData.novelUrl
        ]);
        const novelId = novelRes.rows[0].id;
        console.log(`   ✅ Novel Upserted (ID: ${novelId})`);

        // 5. Add Genres
        for (const genreName of novelData.genres) {
            // Ensure genre exists
            let genreRes = await pool.query('SELECT id FROM "Genre" WHERE name = $1', [genreName]);
            if (genreRes.rows.length === 0) {
                // Generate simple slug
                const genreSlug = genreName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                genreRes = await pool.query(
                    'INSERT INTO "Genre" (name, slug) VALUES ($1, $2) RETURNING id',
                    [genreName, genreSlug]
                );
            }
            const genreId = genreRes.rows[0].id;

            // Link
            await pool.query(
                'INSERT INTO "_GenreToNovel" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [genreId, novelId]
            );
        }
        console.log(`   ✅ Genres Linked: ${novelData.genres.join(', ')}`);

        // 6. Scrape Chapters
        const chapters = [];
        $('.chapter-group__list-item a, .story-chapter a').each((i, el) => {
            const chUrl = $(el).attr('href');
            const chTitle = $(el).text().trim();
            if (chUrl && chUrl.includes('/chapter/')) {
                chapters.push({ url: chUrl, title: chTitle, number: i + 1 });
            }
        });

        console.log(`   📖 Found ${chapters.length} chapters. Starting scrape...`);

        for (const ch of chapters) {
            // Check if exists
            const existCheck = await pool.query(
                'SELECT id FROM "Chapter" WHERE "novelId" = $1 AND "order" = $2',
                [novelId, ch.number]
            );

            if (existCheck.rows.length > 0) {
                process.stdout.write('.'); // Skip indicator
                continue;
            }

            // Fetch Content
            await delay(2000 + Math.random() * 2000); // Random delay 2-4s

            try {
                const chHtml = await fetchPage(ch.url);
                const $ch = cheerio.load(chHtml);

                let content = $('.chapter-content').html() ||
                    $('.chapter__content').html() ||
                    $('.entry-content').html() || '';

                // Clean
                content = content
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
                    .replace(/App\s*Simu/gi, '') // Common junk text
                    .trim();

                if (content.length < 100) {
                    console.log(`\n   ⚠️ Warning: Short content for Ch ${ch.number}`);
                }

                await pool.query(
                    `INSERT INTO "Chapter" ("novelId", title, slug, content, "order", "isFree")
                     VALUES ($1, $2, $3, $4, $5, true)`,
                    [
                        novelId,
                        ch.title,
                        `${slug}-chapter-${ch.number}`,
                        content,
                        ch.number
                    ]
                );
                process.stdout.write('✓');

            } catch (err) {
                console.log(`\n   ❌ Error scraping Ch ${ch.number}: ${err.message}`);
            }
        }
        console.log(`\n   🎉 Completed: ${novelData.title}\n`);
        return true;

    } catch (err) {
        console.error(`\n❌ Failed processing novel: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Batch Scrape for 30 Novels...');

    // Create connection pool once
    try {
        // Test 1 novel first
        const testNovel = targets[0];
        await processNovel(testNovel);

        // Uncomment below for full batch
        // for (const novel of targets) {
        //     const success = await processNovel(novel);
        //     if (!success) {
        //         console.log('🛑 Aborting batch due to error (likely Cloudflare or net issue)');
        //         break;
        //     }
        //     await delay(5000); // Cool down between novels
        // }

    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await pool.end();
    }
}

main();
