/**
 * Local Scraper - Runs on laptop
 * Parses downloaded HTML files and saves novels to database
 * NOTE: Chapter fetching gets 403 blocked - use manual HTML export for chapters
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const CONFIG = {
    HTML_FILE: path.join(__dirname, 'TRENDS - Asianovel.htm'),
};

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Utility functions
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const generateCuid = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'c';
    for (let i = 0; i < 24; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Parse HTML file to extract novels
function parseNovelsFromHtml(htmlPath) {
    const cheerio = require('cheerio');
    log(`Parsing HTML file: ${htmlPath}`);
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const $ = cheerio.load(html);
    const novels = [];

    // Find all novel cards
    $('li.card._story').each((i, el) => {
        const $card = $(el);

        // Extract title and URL
        const titleLink = $card.find('.card__title a').first();
        const title = titleLink.text().trim();
        const url = titleLink.attr('href');

        // Skip premium novels
        if (url && url.includes('premium=1')) {
            log(`⏭️ Skipping premium: ${title}`);
            return;
        }

        // Extract author
        const author = $card.find('.card__by-author .author').text().trim();

        // Extract synopsis
        const synopsis = $card.find('.card__content .truncate span').text().trim();

        // Extract cover image - may need the full URL
        let cover = $card.find('.card__image img').attr('src') || '';
        if (cover && !cover.startsWith('http')) {
            cover = 'https://www.asianovel.net' + cover;
        }

        // Extract status
        const statusEl = $card.find('.card__footer-status');
        const status = statusEl.hasClass('_completed') ? 'COMPLETED' : 'ONGOING';

        // Extract genres
        const genres = [];
        $card.find('.tag-pill._genre').each((j, genreEl) => {
            genres.push($(genreEl).text().trim());
        });

        if (title && url) {
            novels.push({
                title,
                url,
                author,
                synopsis,
                cover,
                status,
                genres,
                slug: slugify(title),
                sourceUrl: url,
            });
        }
    });

    log(`✅ Found ${novels.length} novels`);
    return novels;
}

// Save novel to database using direct PostgreSQL
async function saveNovel(novel) {
    const client = await pool.connect();
    try {
        // Check if exists
        const existingResult = await client.query(
            'SELECT id FROM "Novel" WHERE slug = $1',
            [novel.slug]
        );

        if (existingResult.rows.length > 0) {
            log(`⏭️ Already exists: ${novel.title}`);
            return { id: existingResult.rows[0].id, isNew: false };
        }

        // Insert new novel - matching actual schema
        const novelId = generateCuid();
        await client.query(
            `INSERT INTO "Novel" (id, title, slug, synopsis, cover, author, status, "sourceUrl", "isManual", "totalViews", "avgRating", "ratingCount", "isPremium", "coinCost", "freeChapterLimit", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 0, 0, 0, false, 5, 0, NOW(), NOW())`,
            [novelId, novel.title, novel.slug, novel.synopsis || '', novel.cover || '', novel.author || 'Unknown', novel.status, novel.sourceUrl]
        );

        // Handle genres
        for (const genreName of novel.genres) {
            const genreSlug = slugify(genreName);

            // Get or create genre
            let genreResult = await client.query(
                'SELECT id FROM "Genre" WHERE slug = $1',
                [genreSlug]
            );

            let genreId;
            if (genreResult.rows.length === 0) {
                genreId = generateCuid();
                await client.query(
                    'INSERT INTO "Genre" (id, name, slug) VALUES ($1, $2, $3)',
                    [genreId, genreName, genreSlug]
                );
            } else {
                genreId = genreResult.rows[0].id;
            }

            // Link novel to genre
            await client.query(
                'INSERT INTO "_GenreToNovel" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [genreId, novelId]
            );
        }

        log(`✅ Saved: ${novel.title}`);
        return { id: novelId, isNew: true };

    } catch (error) {
        log(`❌ Error saving novel: ${error.message}`);
        return null;
    } finally {
        client.release();
    }
}

// Main function
async function main() {
    console.log('='.repeat(60));
    log('🚀 LOCAL NOVEL SCRAPER');
    console.log('='.repeat(60));

    // Test database connection
    try {
        await pool.query('SELECT 1');
        log('✅ Database connection successful');
    } catch (error) {
        log(`❌ Database connection failed: ${error.message}`);
        return;
    }

    // Check HTML file
    if (!fs.existsSync(CONFIG.HTML_FILE)) {
        log(`❌ HTML file not found: ${CONFIG.HTML_FILE}`);
        log('Please download the TRENDS page from asianovel.net first');
        return;
    }

    // Parse novels from HTML
    const novels = parseNovelsFromHtml(CONFIG.HTML_FILE);

    if (novels.length === 0) {
        log('❌ No novels found in HTML file');
        return;
    }

    log(`\n📚 Saving ${novels.length} novels...\n`);

    let newCount = 0;
    let existingCount = 0;
    let failedCount = 0;

    for (let i = 0; i < novels.length; i++) {
        const novel = novels[i];
        log(`[${i + 1}/${novels.length}] ${novel.title}`);

        const result = await saveNovel(novel);
        if (result) {
            if (result.isNew) newCount++;
            else existingCount++;
        } else {
            failedCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    log('🎉 COMPLETED!');
    log(`📊 Results:`);
    log(`   ✅ New novels: ${newCount}`);
    log(`   ⏭️ Already existed: ${existingCount}`);
    log(`   ❌ Failed: ${failedCount}`);
    console.log('='.repeat(60));

    console.log('\n⚠️ NOTE: Chapter fetching is blocked by Cloudflare.');
    console.log('   To add chapters, use manual HTML export:');
    console.log('   1. Open novel page in browser (e.g., https://www.asianovel.net/story/3653/)');
    console.log('   2. Press Ctrl+S and save as HTML');
    console.log('   3. Place HTML file in novesia folder');
    console.log('   4. Run: node parse-chapter-html.js <filename>');

    await pool.end();
}

// Run
main().catch(async (e) => {
    console.error(e);
    await pool.end();
    process.exit(1);
});
