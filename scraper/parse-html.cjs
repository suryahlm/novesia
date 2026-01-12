// Script untuk parse HTML trending Asianovel
// Jalankan: node parse-trends.cjs

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const htmlPath = path.join(__dirname, 'HTML Scraping', 'Asianovel', 'TRENDS - Asianovel.htm');

async function main() {
    console.log(`📖 Parsing TRENDS HTML from: ${path.basename(htmlPath)}...\n`);

    const html = fs.readFileSync(htmlPath, 'utf8');
    console.log(`Length of HTML: ${html.length}`);

    const $ = cheerio.load(html);
    const cardCount = $('li.card._story').length;
    console.log(`Found ${cardCount} cards with selector 'li.card._story'`);

    const novels = [];

    // Find all novel cards
    $('li.card._story').each((i, el) => {
        const $card = $(el);

        // Check if completed
        const isCompleted = $card.find('.card__footer-status._completed').length > 0;

        // Check if premium (has premium=1 in URL or coin badge)
        const link = $card.find('.card__image').attr('href') || '';
        const isPremium = link.includes('premium=1');

        // Get data
        const title = $card.find('.card__title a').text().trim();
        const coverUrl = $card.find('.card__image img').attr('src') || '';
        const author = $card.find('.card__by-author a').text().trim();
        const synopsis = $card.find('.card__content .truncate span:last-child').text().trim();
        const chaptersText = $card.find('.card__footer-chapters').text().trim();
        const chaptersCount = parseInt(chaptersText.match(/\d+/)?.[0] || 0);

        // Get genres  
        const genres = [];
        $card.find('.card__tag-list a.tag-pill').each((i, g) => {
            genres.push($(g).text().trim());
        });

        // Get URL slug
        const urlMatch = link.match(/\/story\/(\d+)\/?/);
        const storyId = urlMatch ? urlMatch[1] : null;
        const novelUrl = `https://www.asianovel.net/story/${storyId}/`;

        novels.push({
            title,
            storyId,
            novelUrl,
            coverUrl,
            author,
            synopsis,
            genres,
            chaptersCount,
            isCompleted,
            isPremium
        });
    });

    // Debug: Log first novel to see what we got
    if (novels.length > 0) {
        console.log('--- DEBUG: First Novel Data ---');
        console.log(JSON.stringify(novels[0], null, 2));
        console.log('-------------------------------\n');
    }

    console.log(`Total novels found: ${novels.length}`);

    // Filter: Completed and Free only
    const completedFree = novels.filter(n => n.isCompleted && !n.isPremium);
    console.log(`Completed & Free: ${completedFree.length}\n`);

    console.log('=== Completed & Free Novels ===\n');
    completedFree.forEach((n, i) => {
        console.log(`${i + 1}. ${n.title}`);
        console.log(`   Author: ${n.author}`);
        console.log(`   Chapters: ${n.chaptersCount}`);
        console.log(`   Genres: ${n.genres.join(', ')}`);
        console.log(`   URL: ${n.novelUrl}`);
        console.log(`   Cover: ${n.coverUrl.substring(0, 80)}...`);
        console.log(`   Synopsis: ${n.synopsis.substring(0, 100)}...`);
        console.log('');
    });

    // Save to JSON for later use
    fs.writeFileSync(
        path.join(__dirname, 'trending-completed-free.json'),
        JSON.stringify(completedFree, null, 2)
    );
    console.log(`\n✅ Saved ${completedFree.length} novels to trending-completed-free.json`);
}

main().catch(console.error);
