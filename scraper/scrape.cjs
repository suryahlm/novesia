// Asianovel Scraper - Using curl.exe to bypass Cloudflare
// Dokumentasi: lihat README.md
// Run: node scrape.cjs (dari folder scraper)

require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const cheerio = require('cheerio');
const { Pool } = require('pg');
const { createId } = require('@paralleldrive/cuid2');

const cookies = require('./cookies.cjs');
const targets = require('./target-novels.json');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Ensure covers directory in parent public folder
const coversDir = path.join(__dirname, '..', 'public', 'covers');
if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
}

// Write config file for curl headers (avoids command line length limits)
const curlConfigPath = path.join(__dirname, '.curl-config.txt');
fs.writeFileSync(curlConfigPath, `
user-agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0"
cookie = "${cookies.cookieString}"
`);

// Fetch using curl.exe with config file
function fetchWithCurl(url) {
    try {
        const result = execSync(`curl.exe -s -K "${curlConfigPath}" "${url}"`, {
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024,
            timeout: 60000
        });
        return result;
    } catch (err) {
        throw new Error(`Curl failed: ${err.message}`);
    }
}

// Download image with curl
function downloadCoverWithCurl(url, filename) {
    try {
        const savePath = path.join(coversDir, filename);
        execSync(`curl.exe -s -o "${savePath}" "${url}"`, { timeout: 30000 });
        return `/covers/${filename}`;
    } catch (err) {
        console.error(`   ❌ Failed to download cover: ${err.message}`);
        return null;
    }
}

// Process single novel
async function processNovel(novelData) {
    console.log(`\n📚 Processing: ${novelData.title} (ID: ${novelData.storyId})`);

    try {
        // 1. Fetch Metadata Page
        const html = fetchWithCurl(novelData.novelUrl);

        if (html.includes('Just a moment...') || html.includes('Checking your browser')) {
            throw new Error('Cloudflare challenge detected');
        }

        const $ = cheerio.load(html);

        // 2. Download Cover
        const coverFilename = `novel_${novelData.storyId}.jpg`;
        const localCoverPath = downloadCoverWithCurl(novelData.coverUrl, coverFilename);

        // 3. Extract Full Data
        const fullSynopsis = $('.story__summary .fictioneer-content').text().trim() || novelData.synopsis;
        const author = $('.story__author a').first().text().trim() || novelData.author;

        // 4. Upsert Novel to DB
        const slug = novelData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const insertNovelQuery = `
            INSERT INTO "Novel" (id, title, slug, author, synopsis, cover, status, "sourceUrl", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED', $7, NOW(), NOW())
            ON CONFLICT (slug) DO UPDATE SET
                cover = EXCLUDED.cover,
                synopsis = EXCLUDED.synopsis,
                "sourceUrl" = EXCLUDED."sourceUrl",
                "updatedAt" = NOW()
            RETURNING id;
        `;

        const novelId = createId();
        const novelRes = await pool.query(insertNovelQuery, [
            novelId,
            novelData.title,
            slug,
            author,
            fullSynopsis,
            localCoverPath || novelData.coverUrl,
            novelData.novelUrl
        ]);
        const finalNovelId = novelRes.rows[0].id;
        console.log(`   ✅ Novel Upserted (ID: ${finalNovelId})`);

        // 5. Add Genres
        for (const genreName of novelData.genres) {
            let genreRes = await pool.query('SELECT id FROM "Genre" WHERE name = $1', [genreName]);
            if (genreRes.rows.length === 0) {
                const genreSlug = genreName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const genreId = createId();
                genreRes = await pool.query(
                    'INSERT INTO "Genre" (id, name, slug) VALUES ($1, $2, $3) RETURNING id',
                    [genreId, genreName, genreSlug]
                );
            }
            const genreId = genreRes.rows[0].id;
            await pool.query(
                'INSERT INTO "_GenreToNovel" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [genreId, finalNovelId]
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
                'SELECT id FROM "Chapter" WHERE "novelId" = $1 AND "chapterNumber" = $2',
                [finalNovelId, ch.number]
            );

            if (existCheck.rows.length > 0) {
                process.stdout.write('.');
                continue;
            }

            // Delay between chapters
            await delay(1500 + Math.random() * 1000);

            try {
                const chHtml = fetchWithCurl(ch.url);
                const $ch = cheerio.load(chHtml);

                let content = $ch('.chapter-content').html() ||
                    $ch('.chapter__content').html() ||
                    $ch('.entry-content').html() || '';

                // Clean
                content = content
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
                    .trim();

                const chapterId = createId();
                await pool.query(
                    `INSERT INTO "Chapter" (id, "novelId", title, "chapterNumber", "contentOriginal", "contentTranslated", "createdAt", "updatedAt")
                     VALUES ($1, $2, $3, $4, $5, $5, NOW(), NOW())`,
                    [
                        chapterId,
                        finalNovelId,
                        ch.title,
                        ch.number,
                        content
                    ]
                );
                process.stdout.write('✓');

            } catch (err) {
                console.log(`\n   ❌ Error Ch ${ch.number}: ${err.message}`);
            }
        }
        console.log(`\n   🎉 Completed: ${novelData.title}\n`);
        return true;

    } catch (err) {
        console.error(`\n❌ Failed: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Batch Scrape (curl method)...\n');

    try {
        // Process all 30 novels
        for (let i = 0; i < targets.length; i++) {
            const success = await processNovel(targets[i]);
            if (!success) {
                console.log('\n⚠️ Novel failed, continuing to next...');
            }
            await delay(3000); // Cool down between novels
        }

        console.log('\n🎉 Batch scraping completed!');


    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await pool.end();
    }
}

main();
