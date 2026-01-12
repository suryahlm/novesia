// Auto Scraper for Asianovel - Scrape 20 novels dengan cookies
// Jalankan: node auto-scrape.cjs

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { Pool } = require('pg');

const cookies = require('./asianovel-cookies.cjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with cookies
async function fetchPage(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': cookies.cookieString,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
}

// Test if cookies work
async function testCookies() {
    console.log('🧪 Testing cookies...');
    try {
        const html = await fetchPage('https://www.asianovel.net/story/3540/');
        const $ = cheerio.load(html);

        // Check if we can access story page
        const title = $('h1.story__title').text().trim() || $('title').text();
        console.log(`✅ Cookies work! Found: "${title}"`);
        return true;
    } catch (err) {
        console.log(`❌ Cookie test failed: ${err.message}`);
        return false;
    }
}

// Extract novel metadata from story page
async function scrapeNovelMetadata(url) {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Title
    const title = $('h1.story__title').text().trim() ||
        $('.fictioneer-card-story h1').text().trim();

    // Author
    const author = $('.story__author a').first().text().trim() ||
        $('a[href*="/author/"]').first().text().trim();

    // Synopsis
    const synopsis = $('.story__summary .fictioneer-content').text().trim() ||
        $('.story__summary').text().trim();

    // Cover image
    const coverUrl = $('.story__thumbnail img').attr('src') ||
        $('.story__cover img').attr('src') || '';

    // Genres
    const genres = [];
    $('.story__tags a.tag-pill._genre, .story__taxonomies a[href*="/genre/"]').each((i, el) => {
        genres.push($(el).text().trim());
    });

    // Status
    const isCompleted = html.includes('_completed') || html.includes('Completed');

    // Chapter list
    const chapters = [];
    $('.chapter-group__list-item a, .story-chapter a').each((i, el) => {
        const chTitle = $(el).text().trim();
        const chUrl = $(el).attr('href');
        if (chUrl && chUrl.includes('/chapter/')) {
            chapters.push({ number: i + 1, title: chTitle, url: chUrl });
        }
    });

    return {
        title,
        author,
        synopsis,
        coverUrl,
        genres,
        isCompleted,
        chapters,
        sourceUrl: url
    };
}

// Scrape chapter content
async function scrapeChapter(url) {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Get chapter title
    const title = $('h1.chapter-title').text().trim() ||
        $('.chapter__title').text().trim() ||
        $('h2.chapter__title').text().trim();

    // Get chapter content
    const content = $('.chapter-content').html() ||
        $('.chapter__content').html() ||
        $('.entry-content').html() || '';

    // Clean content
    const cleanContent = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');

    return { title, content: cleanContent };
}

async function main() {
    // Test cookies first
    const cookiesWork = await testCookies();

    if (!cookiesWork) {
        console.log('\n⚠️ Cookies tidak bekerja atau sudah expired.');
        console.log('Silakan update cookies di asianovel-cookies.cjs');
        return;
    }

    // Load selected novels
    const selectedNovels = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'selected-novels.json'), 'utf8')
    );

    console.log(`\n📚 Found ${selectedNovels.length} novels to scrape\n`);

    // Test scrape first novel
    const firstNovel = selectedNovels[0];
    console.log(`🔍 Testing scrape: ${firstNovel.title}`);
    console.log(`   URL: ${firstNovel.novelUrl}`);

    try {
        const metadata = await scrapeNovelMetadata(firstNovel.novelUrl);
        console.log(`\n✅ Scraped metadata:`);
        console.log(`   Title: ${metadata.title}`);
        console.log(`   Author: ${metadata.author}`);
        console.log(`   Cover: ${metadata.coverUrl?.substring(0, 60)}...`);
        console.log(`   Synopsis: ${metadata.synopsis?.substring(0, 100)}...`);
        console.log(`   Genres: ${metadata.genres.join(', ')}`);
        console.log(`   Chapters found: ${metadata.chapters.length}`);

        if (metadata.chapters.length > 0) {
            console.log(`\n🔍 Testing first chapter...`);
            await delay(1000);
            const ch = await scrapeChapter(metadata.chapters[0].url);
            console.log(`   Chapter title: ${ch.title}`);
            console.log(`   Content length: ${ch.content?.length || 0} chars`);
        }

        console.log(`\n✅ Test successful!`);
        console.log(`\nTo scrape all novels, run: node auto-scrape.cjs --full`);

    } catch (err) {
        console.log(`\n❌ Error: ${err.message}`);
        console.log(`\nCookies might be blocked or Cloudflare protection active.`);
    }
}

main().catch(console.error);
