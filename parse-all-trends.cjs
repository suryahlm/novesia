// Script untuk parse HTML trending Asianovel - No filter version
// Jalankan: node parse-all-trends.cjs

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const htmlPath = path.join(__dirname, 'HTML Scraping', 'Asianovel', 'TRENDS - Asianovel (12_1_2026 10.38.41).html');

async function main() {
    console.log(`📖 Parsing TRENDS HTML from: ${path.basename(htmlPath)}...\n`);

    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    const novels = [];

    // Find all novel cards - using the actual class structure from SingleFile
    $('li.card._story').each((i, el) => {
        const $card = $(el);

        // Get post ID from class (e.g. post-3653)
        const classList = $card.attr('class') || '';
        const postMatch = classList.match(/post-(\d+)/);
        const storyId = postMatch ? postMatch[1] : null;

        // Get title and URL from anchor
        const $titleLink = $card.find('a[href*="/story/"]').first();
        const novelUrl = $titleLink.attr('href') || '';
        const title = $card.find('h3 a, .card__title a, a.truncate').first().text().trim() ||
            $titleLink.attr('title') ||
            $titleLink.text().trim().split('\n')[0];

        // Get cover image
        const coverUrl = $card.find('img').first().attr('src') || '';

        // Try to extract author
        const authorText = $card.text();
        const authorMatch = authorText.match(/by\s+([^\n]+)/i);
        const author = authorMatch ? authorMatch[1].trim() : '';

        // Only add if we have basic data
        if (storyId && title) {
            novels.push({
                title: title.substring(0, 100), // Truncate long titles
                storyId,
                novelUrl: novelUrl || `https://www.asianovel.net/story/${storyId}/`,
                coverUrl,
                author: author.substring(0, 50)
            });
        }
    });

    console.log(`Total novels parsed: ${novels.length}\n`);

    // Show sample
    console.log('=== Sample Novels (first 10) ===\n');
    novels.slice(0, 10).forEach((n, i) => {
        console.log(`${i + 1}. ${n.title}`);
        console.log(`   ID: ${n.storyId}`);
        console.log(`   URL: ${n.novelUrl}`);
        console.log('');
    });

    // Save to JSON
    const outputPath = path.join(__dirname, 'all-trending-novels.json');
    fs.writeFileSync(outputPath, JSON.stringify(novels, null, 2));
    console.log(`\n✅ Saved ${novels.length} novels to all-trending-novels.json`);

    console.log('\n⚠️  NOTE: Halaman TRENDS tidak menampilkan status Completed/Ongoing.');
    console.log('    Untuk filter "Completed & Free", perlu save halaman Browse dengan filter.');
    console.log('    URL: https://www.asianovel.net/stories/?status=2 (Completed only)');
}

main().catch(console.error);
