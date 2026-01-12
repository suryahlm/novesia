/**
 * Puppeteer Stealth Scraper - FULL VERSION
 * Scrapes novels AND chapter content from AsianNovel
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { Pool } = require('pg');
require('dotenv').config();

puppeteer.use(StealthPlugin());

const CONFIG = {
    MAX_NOVELS: 10,           // Limit novels per run (to avoid overload)
    MAX_CHAPTERS: 30,         // Max chapters per novel
    DELAY_MS: 3000,           // Delay between requests
    TIMEOUT_MS: 60000,
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const cuid = () => 'c' + Array(24).fill(0).map(() => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

async function scrapeNovelList(page) {
    log('📖 Navigating to trends...');
    await page.goto('https://www.asianovel.net/trends/', { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT_MS });
    await page.waitForSelector('li.card._story', { timeout: 30000 });

    const novels = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('li.card._story').forEach(card => {
            const link = card.querySelector('.card__title a');
            if (!link || link.href.includes('premium')) return;
            items.push({
                title: link.textContent.trim(),
                url: link.href,
                author: card.querySelector('.card__by-author .author')?.textContent?.trim() || 'Unknown',
                synopsis: card.querySelector('.card__content .truncate span')?.textContent?.trim() || '',
                cover: card.querySelector('.card__image img')?.src || '',
                status: card.querySelector('.card__footer-status')?.classList.contains('_completed') ? 'COMPLETED' : 'ONGOING'
            });
        });
        return items;
    });

    log(`📚 Found ${novels.length} novels`);
    return novels.slice(0, CONFIG.MAX_NOVELS);
}

async function scrapeChapterList(page, novelUrl) {
    log(`🔍 Getting chapters from: ${novelUrl}`);
    await page.goto(novelUrl, { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT_MS });
    await sleep(2000);

    const chapters = await page.evaluate(() => {
        const items = [];
        // Multiple selectors for chapter lists
        const selectors = [
            '.chapter-group__list-item a',
            '.chapter-list a',
            '[class*="chapter-item"] a',
            '.story-chapters a'
        ];

        for (const sel of selectors) {
            document.querySelectorAll(sel).forEach((el, i) => {
                const href = el.href;
                const text = el.textContent?.trim() || '';
                if (href && text && !href.includes('premium') && !items.find(x => x.url === href)) {
                    const numMatch = text.match(/chapter\s*(\d+)/i) || text.match(/^(\d+)/) || text.match(/(\d+)/);
                    items.push({
                        number: numMatch ? parseInt(numMatch[1]) : items.length + 1,
                        title: text.substring(0, 200),
                        url: href
                    });
                }
            });
        }
        return items;
    });

    chapters.sort((a, b) => a.number - b.number);
    log(`📑 Found ${chapters.length} chapters`);
    return chapters.slice(0, CONFIG.MAX_CHAPTERS);
}

async function scrapeChapterContent(page, chapterUrl) {
    await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT_MS });
    await sleep(2000);

    const content = await page.evaluate(() => {
        // Remove ads and unwanted elements
        document.querySelectorAll('script, style, .ads, .advertisement, [class*="ad-"], .hidden').forEach(el => el.remove());

        // Find content with multiple selectors
        const selectors = [
            '.chapter__content',
            '.chapter-content',
            '.reading-content',
            '.text-left',
            '#chapter-content',
            'article .entry-content',
            '.content-inner'
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.length > 200) {
                return el.innerHTML;
            }
        }
        return '';
    });

    return content;
}

async function saveNovel(novel) {
    const client = await pool.connect();
    try {
        const slug = slugify(novel.title);
        const exists = await client.query('SELECT id FROM "Novel" WHERE slug=$1', [slug]);

        if (exists.rows.length > 0) {
            return { id: exists.rows[0].id, isNew: false };
        }

        const id = cuid();
        await client.query(
            `INSERT INTO "Novel" (id,title,slug,synopsis,cover,author,status,"sourceUrl","isManual","totalViews","avgRating","ratingCount","isPremium","coinCost","freeChapterLimit","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,0,0,0,false,5,0,NOW(),NOW())`,
            [id, novel.title, slug, novel.synopsis, novel.cover, novel.author, novel.status, novel.url]
        );

        return { id, isNew: true };
    } finally {
        client.release();
    }
}

async function saveChapter(novelId, chapter, content) {
    const client = await pool.connect();
    try {
        const exists = await client.query(
            'SELECT id FROM "Chapter" WHERE "novelId"=$1 AND "chapterNumber"=$2',
            [novelId, chapter.number]
        );

        if (exists.rows.length > 0) return false;

        const id = cuid();
        const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).length;

        await client.query(
            `INSERT INTO "Chapter" (id,"novelId","chapterNumber",title,"contentOriginal","contentTranslated","wordCount","isPremium","coinCost",views,"sourceUrl","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,'',$6,false,0,0,$7,NOW(),NOW())`,
            [id, novelId, chapter.number, chapter.title, content, wordCount, chapter.url]
        );

        return true;
    } finally {
        client.release();
    }
}

async function main() {
    console.log('='.repeat(60));
    log('🚀 PUPPETEER STEALTH SCRAPER - FULL VERSION');
    log('📖 Scrapes: Novels + Chapter Content');
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        // 1. Get novel list
        const novels = await scrapeNovelList(page);

        let totalChaptersSaved = 0;
        let novelsProcessed = 0;

        for (const novel of novels) {
            novelsProcessed++;
            log(`\n[${novelsProcessed}/${novels.length}] ${novel.title}`);

            // 2. Save novel
            const result = await saveNovel(novel);
            if (result.isNew) {
                log(`✅ New novel saved`);
            } else {
                log(`⏭️ Novel exists, checking chapters...`);
            }

            // 3. Get chapter list
            await sleep(CONFIG.DELAY_MS);
            const chapters = await scrapeChapterList(page, novel.url);

            if (chapters.length === 0) {
                log(`⚠️ No chapters found`);
                continue;
            }

            // 4. Scrape each chapter
            for (const chapter of chapters) {
                await sleep(CONFIG.DELAY_MS);

                // Check if chapter exists first
                const client = await pool.connect();
                const exists = await client.query(
                    'SELECT id FROM "Chapter" WHERE "novelId"=$1 AND "chapterNumber"=$2',
                    [result.id, chapter.number]
                );
                client.release();

                if (exists.rows.length > 0) {
                    log(`  ⏭️ Ch.${chapter.number} exists`);
                    continue;
                }

                log(`  📄 Scraping Ch.${chapter.number}...`);
                const content = await scrapeChapterContent(page, chapter.url);

                if (content && content.length > 100) {
                    const saved = await saveChapter(result.id, chapter, content);
                    if (saved) {
                        totalChaptersSaved++;
                        log(`  ✅ Ch.${chapter.number} saved (${content.length} chars)`);
                    }
                } else {
                    log(`  ❌ Ch.${chapter.number} no content`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        log('🎉 SCRAPING COMPLETED!');
        log(`📊 Novels processed: ${novelsProcessed}`);
        log(`📖 Chapters saved: ${totalChaptersSaved}`);
        console.log('='.repeat(60));

    } catch (error) {
        log(`❌ Error: ${error.message}`);
    } finally {
        await browser.close();
        await pool.end();
    }
}

main().catch(console.error);
