/**
 * Puppeteer Stealth Scraper for AsianNovel
 * Bypasses Cloudflare protection using stealth plugin
 * 
 * USAGE:
 * 1. Install on VPS: npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
 * 2. Run: node puppeteer-scraper.js
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { Pool } = require('pg');
require('dotenv').config();

// Apply stealth plugin
puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
    MAX_CHAPTERS: 50,          // Max chapters per novel
    DELAY_MS: 3000,            // Delay between requests (be nice to server)
    TIMEOUT_MS: 60000,         // Page load timeout
    HEADLESS: true,            // Run without visible browser
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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

// Scrape novel list from trending page
async function scrapeNovelList(browser) {
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        log('📖 Navigating to trending page...');
        await page.goto('https://www.asianovel.net/trends/', {
            waitUntil: 'networkidle2',
            timeout: CONFIG.TIMEOUT_MS,
        });

        // Wait for content to load
        await page.waitForSelector('li.card._story', { timeout: 30000 });

        // Extract novel data
        const novels = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('li.card._story').forEach(card => {
                const titleLink = card.querySelector('.card__title a');
                const url = titleLink?.href || '';

                // Skip premium
                if (url.includes('premium=1')) return;

                const title = titleLink?.textContent?.trim() || '';
                const author = card.querySelector('.card__by-author .author')?.textContent?.trim() || '';
                const synopsis = card.querySelector('.card__content .truncate span')?.textContent?.trim() || '';
                const cover = card.querySelector('.card__image img')?.src || '';
                const statusEl = card.querySelector('.card__footer-status');
                const status = statusEl?.classList.contains('_completed') ? 'COMPLETED' : 'ONGOING';

                const genres = [];
                card.querySelectorAll('.tag-pill._genre').forEach(g => {
                    genres.push(g.textContent.trim());
                });

                if (title && url) {
                    items.push({ title, url, author, synopsis, cover, status, genres });
                }
            });
            return items;
        });

        log(`✅ Found ${novels.length} novels`);
        return novels;

    } catch (error) {
        log(`❌ Error scraping novel list: ${error.message}`);
        return [];
    } finally {
        await page.close();
    }
}

// Scrape chapters from a novel page
async function scrapeChapters(browser, novelUrl) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        log(`🔍 Fetching chapters from: ${novelUrl}`);
        await page.goto(novelUrl, {
            waitUntil: 'networkidle2',
            timeout: CONFIG.TIMEOUT_MS,
        });

        // Wait for chapter list
        await sleep(2000);

        // Extract chapter links
        const chapters = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('.chapter-group__list-item a, [class*="chapter"] a').forEach((el, i) => {
                const href = el.href;
                const text = el.textContent?.trim() || '';

                if (href && text && !href.includes('premium')) {
                    const numMatch = text.match(/chapter\s*(\d+)/i) || text.match(/(\d+)/);
                    items.push({
                        number: numMatch ? parseInt(numMatch[1]) : i + 1,
                        title: text,
                        url: href,
                    });
                }
            });
            return items;
        });

        chapters.sort((a, b) => a.number - b.number);
        return chapters.slice(0, CONFIG.MAX_CHAPTERS);

    } catch (error) {
        log(`❌ Error fetching chapters: ${error.message}`);
        return [];
    } finally {
        await page.close();
    }
}

// Scrape chapter content
async function scrapeChapterContent(browser, chapterUrl) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        await page.goto(chapterUrl, {
            waitUntil: 'networkidle2',
            timeout: CONFIG.TIMEOUT_MS,
        });

        // Wait for content
        await sleep(1500);

        // Extract content
        const content = await page.evaluate(() => {
            // Remove ads
            document.querySelectorAll('script, style, .ads, .advertisement, [class*="ad-"]').forEach(el => el.remove());

            // Find content
            const selectors = ['.chapter-content', '.content-inner', '.reading-content', '.text-left', '#chapter-content'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.innerText.length > 100) {
                    return el.innerHTML;
                }
            }
            return '';
        });

        return content;

    } catch (error) {
        log(`❌ Error fetching content: ${error.message}`);
        return '';
    } finally {
        await page.close();
    }
}

// Save novel to database
async function saveNovel(novel) {
    const client = await pool.connect();
    try {
        const slug = slugify(novel.title);

        const existing = await client.query('SELECT id FROM "Novel" WHERE slug = $1', [slug]);
        if (existing.rows.length > 0) {
            log(`⏭️ Already exists: ${novel.title}`);
            return { id: existing.rows[0].id, isNew: false };
        }

        const novelId = generateCuid();
        await client.query(
            `INSERT INTO "Novel" (id, title, slug, synopsis, cover, author, status, "sourceUrl", "isManual", "totalViews", "avgRating", "ratingCount", "isPremium", "coinCost", "freeChapterLimit", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 0, 0, 0, false, 5, 0, NOW(), NOW())`,
            [novelId, novel.title, slug, novel.synopsis || '', novel.cover || '', novel.author || 'Unknown', novel.status, novel.url]
        );

        // Handle genres
        for (const genreName of novel.genres) {
            const genreSlug = slugify(genreName);
            let genreResult = await client.query('SELECT id FROM "Genre" WHERE slug = $1', [genreSlug]);

            let genreId;
            if (genreResult.rows.length === 0) {
                genreId = generateCuid();
                await client.query('INSERT INTO "Genre" (id, name, slug) VALUES ($1, $2, $3)', [genreId, genreName, genreSlug]);
            } else {
                genreId = genreResult.rows[0].id;
            }

            await client.query('INSERT INTO "_GenreToNovel" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING', [genreId, novelId]);
        }

        log(`✅ Saved: ${novel.title}`);
        return { id: novelId, isNew: true };

    } catch (error) {
        log(`❌ Error saving: ${error.message}`);
        return null;
    } finally {
        client.release();
    }
}

// Save chapter to database
async function saveChapter(novelId, chapter, content) {
    const client = await pool.connect();
    try {
        const existing = await client.query(
            'SELECT id FROM "Chapter" WHERE "novelId" = $1 AND "chapterNumber" = $2',
            [novelId, chapter.number]
        );

        if (existing.rows.length > 0) return false;

        const chapterId = generateCuid();
        const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).length;

        await client.query(
            `INSERT INTO "Chapter" (id, "novelId", "chapterNumber", title, "contentOriginal", "contentTranslated", "wordCount", "isPremium", "coinCost", views, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, '', $6, false, 0, 0, NOW(), NOW())`,
            [chapterId, novelId, chapter.number, chapter.title, content, wordCount]
        );

        return true;
    } catch (error) {
        log(`❌ Error saving chapter: ${error.message}`);
        return false;
    } finally {
        client.release();
    }
}

// Main function
async function main() {
    console.log('='.repeat(60));
    log('🚀 PUPPETEER STEALTH SCRAPER');
    console.log('='.repeat(60));

    // Test database
    try {
        await pool.query('SELECT 1');
        log('✅ Database connected');
    } catch (error) {
        log(`❌ Database error: ${error.message}`);
        return;
    }

    // Launch browser
    log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
        headless: CONFIG.HEADLESS,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080',
        ],
    });

    try {
        // Scrape novel list
        const novels = await scrapeNovelList(browser);

        if (novels.length === 0) {
            log('❌ No novels found');
            return;
        }

        log(`\n📚 Processing ${novels.length} novels...\n`);

        let totalChapters = 0;

        for (let i = 0; i < novels.length; i++) {
            const novel = novels[i];
            log(`\n[${i + 1}/${novels.length}] ${novel.title}`);

            // Save novel
            const result = await saveNovel(novel);
            if (!result) continue;

            // Scrape chapters
            await sleep(CONFIG.DELAY_MS);
            const chapters = await scrapeChapters(browser, novel.url);

            if (chapters.length === 0) {
                log(`⚠️ No chapters found`);
                continue;
            }

            log(`📖 Found ${chapters.length} chapters`);

            // Scrape and save each chapter
            for (const chapter of chapters) {
                await sleep(CONFIG.DELAY_MS);
                log(`  Chapter ${chapter.number}...`);

                const content = await scrapeChapterContent(browser, chapter.url);
                if (content) {
                    const saved = await saveChapter(result.id, chapter, content);
                    if (saved) {
                        totalChapters++;
                        log(`  ✅ Saved`);
                    }
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        log('🎉 COMPLETED!');
        log(`📊 Total chapters saved: ${totalChapters}`);
        console.log('='.repeat(60));

    } finally {
        await browser.close();
        await pool.end();
    }
}

main().catch(console.error);
