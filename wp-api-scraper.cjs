/**
 * WordPress REST API Novel Scraper
 * Bulk fetch chapters from WordPress sites using REST API
 * Much faster than page-by-page scraping (2-3 requests vs 100+ requests)
 */

const fs = require('fs');
const path = require('path');

// Configuration for novel sources from ExiledRebels
const SOURCES = {
    mdzs: {
        name: "Grandmaster of Demonic Cultivation",
        shortName: "MDZS",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "578463644",
        chapterPattern: /^GDC Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/grandmaster-of-demonic-cultivation/",
        outputFile: "mdzs_raw.json"
    },
    lmw: {
        name: "The Legendary Master's Wife",
        shortName: "LMW",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "578463652",
        chapterPattern: /^LMW Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/the-legendary-masters-wife/",
        outputFile: "lmw_raw.json"
    },
    spirithotel: {
        name: "Spirit Hotel",
        shortName: "SH",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "581289378",
        chapterPattern: /^SH Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/spirit-hotel/",
        outputFile: "spirithotel_raw.json"
    },
    heand: {
        name: "He and It",
        shortName: "HAI",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "582345270",
        chapterPattern: /Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/he-and-it/",
        outputFile: "heand_raw.json"
    },
    quicktrans: {
        name: "Quick Transmigration: Lovers Always on the Counterattack",
        shortName: "QT",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "582344643",
        chapterPattern: /Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/quick-transmigration-lovers-always-on-the-counterattack/",
        outputFile: "quicktrans_raw.json"
    },
    genius: {
        name: "The Genius' Playbook",
        shortName: "TGP",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "582345335",
        chapterPattern: /Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/the-genius-playbook/",
        outputFile: "genius_raw.json"
    },
    beaststore: {
        name: "Beast Store No. 138",
        shortName: "BS138",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "582344563",
        chapterPattern: /Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/beast-store-no-138/",
        outputFile: "beaststore_raw.json"
    },
    farming: {
        name: "Farming Together with Interstellar People",
        shortName: "FIP",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "582345241",
        chapterPattern: /Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/farming-together-with-interstellar-people/",
        outputFile: "farming_raw.json"
    },
    doctor: {
        name: "Full-Time Doctor (Guideverse)",
        shortName: "FTD",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "582345339",
        chapterPattern: /Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/full-time-doctor/",
        outputFile: "doctor_raw.json"
    },
    lessons: {
        name: "Lessons on Raising a Partner",
        shortName: "LRP",
        baseUrl: "https://exiledrebelsscanlations.com",
        apiEndpoint: "/wp-json/wp/v2/posts",
        categoryId: "582344592",
        chapterPattern: /Chapter (\d+)/i,
        novelPageUrl: "https://exiledrebelsscanlations.com/lessons-on-raising-a-partner/",
        outputFile: "lessons_raw.json"
    }
};

/**
 * Fetch all posts from a WordPress REST API category
 */
async function fetchAllPosts(source) {
    const allPosts = [];
    let page = 1;
    const perPage = 100; // WordPress max is 100

    console.log(`\n📚 Fetching from: ${source.name}`);
    console.log(`   API: ${source.baseUrl}${source.apiEndpoint}`);
    console.log(`   Category ID: ${source.categoryId}\n`);

    while (true) {
        const url = `${source.baseUrl}${source.apiEndpoint}?categories=${source.categoryId}&per_page=${perPage}&page=${page}`;
        console.log(`   Fetching page ${page}...`);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 400) {
                    // No more pages
                    break;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const posts = await response.json();

            if (posts.length === 0) {
                break;
            }

            allPosts.push(...posts);
            console.log(`   ✓ Got ${posts.length} posts (total: ${allPosts.length})`);

            if (posts.length < perPage) {
                // Last page
                break;
            }

            page++;
        } catch (error) {
            console.error(`   ✗ Error: ${error.message}`);
            break;
        }
    }

    return allPosts;
}

/**
 * Filter and clean posts to get only chapter content
 */
function filterChapters(posts, source) {
    const chapters = [];

    for (const post of posts) {
        const title = post.title.rendered;
        const match = title.match(source.chapterPattern);

        if (match) {
            const chapterNum = parseFloat(match[1]);

            // Clean HTML content - preserve paragraph structure
            let content = post.content.rendered;

            // First, convert <p> and <br> tags to paragraph markers
            content = content
                .replace(/<p[^>]*>/gi, '\n\n')  // Start of paragraph
                .replace(/<\/p>/gi, '\n\n')      // End of paragraph
                .replace(/<br\s*\/?>/gi, '\n')   // Line breaks
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, '')         // Remove remaining HTML tags
                .replace(/&nbsp;/g, ' ')
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#8217;/g, "'")
                .replace(/&#8220;/g, '"')
                .replace(/&#8221;/g, '"')
                .replace(/&#8211;/g, '-')
                .replace(/&#8212;/g, '—')
                // Filter garbage/promo text patterns
                .replace(/Temukan lebih banyak.*/gi, '')
                .replace(/Please buy the official.*/gi, '')
                .replace(/Support the author.*/gi, '')
                .replace(/Affiliated Links.*/gi, '')
                .replace(/Book \d+\s*$/gm, '')   // Remove standalone "Book 1", "Book 2" etc
                .replace(/\n{3,}/g, '\n\n')      // Normalize multiple newlines to double
                .trim();

            chapters.push({
                number: chapterNum,
                title: title.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'"),
                content: content,
                wordCount: content.split(/\s+/).length,
                sourceUrl: post.link,
                date: post.date
            });
        }
    }

    // Sort by chapter number
    chapters.sort((a, b) => a.number - b.number);

    return chapters;
}

/**
 * Save chapters to JSON file
 */
function saveToFile(chapters, source) {
    const outputDir = path.join(__dirname, 'scraper-data', 'data', 'raw', 'novels');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, source.outputFile);

    const data = {
        novel: source.name,
        fetchedAt: new Date().toISOString(),
        totalChapters: chapters.length,
        chapters: chapters
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    return outputPath;
}

/**
 * Main function
 */
async function main() {
    const sourceKey = process.argv[2] || 'mdzs';
    const source = SOURCES[sourceKey];

    if (!source) {
        console.error(`Unknown source: ${sourceKey}`);
        console.log('Available sources:', Object.keys(SOURCES).join(', '));
        process.exit(1);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  WordPress REST API Scraper');
    console.log('═══════════════════════════════════════════════════════════════');

    // Fetch all posts
    const posts = await fetchAllPosts(source);
    console.log(`\n📋 Total posts fetched: ${posts.length}`);

    // Filter to chapters only
    const chapters = filterChapters(posts, source);
    console.log(`📖 Chapters extracted: ${chapters.length}`);

    if (chapters.length === 0) {
        console.log('\n⚠️  No chapters found! Check the chapter pattern regex.');
        process.exit(1);
    }

    // Show chapter range
    const firstCh = chapters[0];
    const lastCh = chapters[chapters.length - 1];
    console.log(`   First: Chapter ${firstCh.number} - ${firstCh.title}`);
    console.log(`   Last:  Chapter ${lastCh.number} - ${lastCh.title}`);

    // Calculate total words
    const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    console.log(`\n📊 Total words: ${totalWords.toLocaleString()}`);

    // Save to file
    const outputPath = saveToFile(chapters, source);
    console.log(`\n💾 Saved to: ${outputPath}`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Scraping Complete!');
    console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
