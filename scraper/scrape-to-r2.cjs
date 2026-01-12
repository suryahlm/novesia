// Asianovel Scraper - Save to R2 (Raw Storage)
// Simpan hasil scraping ke R2, TIDAK langsung ke database
// Run: node scrape-to-r2.cjs

require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const cheerio = require('cheerio');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const cookies = require('./cookies.cjs');
const targets = require('./target-novels.json');

// R2 Configuration
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'novesia-assets';
const R2_ENDPOINT = process.env.R2_ENDPOINT;

const r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Write config file for curl headers
const curlConfigPath = path.join(__dirname, '.curl-config.txt');
fs.writeFileSync(curlConfigPath, `
user-agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0"
cookie = "${cookies.cookieString}"
`);

// Fetch using curl.exe
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

// Upload to R2
async function uploadToR2(key, content, contentType = 'text/html') {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: contentType,
    });
    await r2Client.send(command);
    console.log(`   📤 Uploaded: ${key}`);
}

// Download and upload cover
async function uploadCover(coverUrl, slug) {
    try {
        const response = await fetch(coverUrl);
        if (!response.ok) throw new Error('Failed to fetch cover');

        const buffer = Buffer.from(await response.arrayBuffer());
        const key = `raw-novels/${slug}/cover.jpg`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'image/jpeg',
        });
        await r2Client.send(command);
        return key;
    } catch (err) {
        console.error(`   ❌ Cover upload failed: ${err.message}`);
        return null;
    }
}

// Process single novel
async function processNovel(novelData) {
    console.log(`\n📚 Processing: ${novelData.title} (ID: ${novelData.storyId})`);

    const slug = novelData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
        // 1. Fetch Metadata Page
        const html = fetchWithCurl(novelData.novelUrl);

        if (html.includes('Just a moment...') || html.includes('Checking your browser')) {
            throw new Error('Cloudflare challenge detected');
        }

        const $ = cheerio.load(html);

        // 2. Upload Cover to R2
        const coverKey = await uploadCover(novelData.coverUrl, slug);

        // 3. Extract Data
        const fullSynopsis = $('.story__summary .fictioneer-content').text().trim() || novelData.synopsis;
        const author = $('.story__author a').first().text().trim() || novelData.author;

        // 4. Extract chapter list
        const chapters = [];
        $('.chapter-group__list-item a, .story-chapter a').each((i, el) => {
            const chUrl = $(el).attr('href');
            const chTitle = $(el).text().trim();
            if (chUrl && chUrl.includes('/chapter/')) {
                chapters.push({ url: chUrl, title: chTitle, number: i + 1 });
            }
        });

        // 5. Save metadata to R2
        const metadata = {
            storyId: novelData.storyId,
            title: novelData.title,
            slug,
            author,
            synopsis: fullSynopsis,
            coverKey,
            sourceUrl: novelData.novelUrl,
            genres: novelData.genres,
            chaptersCount: chapters.length,
            chapters: chapters.map(c => ({ number: c.number, title: c.title })),
            scrapedAt: new Date().toISOString(),
        };

        await uploadToR2(
            `raw-novels/${slug}/metadata.json`,
            JSON.stringify(metadata, null, 2),
            'application/json'
        );
        console.log(`   ✅ Metadata saved`);

        // 6. Scrape and upload chapters
        console.log(`   📖 Scraping ${chapters.length} chapters...`);

        for (const ch of chapters) {
            await delay(1500 + Math.random() * 1000);

            try {
                const chHtml = fetchWithCurl(ch.url);
                const $ch = cheerio.load(chHtml);

                let content = $ch('.chapter-content').html() ||
                    $ch('.chapter__content').html() ||
                    $ch('.entry-content').html() || '';

                // Clean content
                content = content
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
                    .trim();

                // Wrap in HTML structure
                const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${ch.title}</title>
</head>
<body>
    <h1>${ch.title}</h1>
    <div class="content">
        ${content}
    </div>
</body>
</html>`;

                await uploadToR2(
                    `raw-novels/${slug}/chapters/${ch.number}.html`,
                    fullHtml,
                    'text/html'
                );
                process.stdout.write('✓');

            } catch (err) {
                console.log(`\n   ❌ Ch ${ch.number}: ${err.message}`);
                process.stdout.write('✗');
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
    console.log('🚀 Starting Scrape to R2 (Raw Storage)...\n');
    console.log(`📦 Bucket: ${R2_BUCKET_NAME}`);
    console.log(`📂 Path: raw-novels/{slug}/\n`);

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
        console.error('❌ R2 credentials not found in .env');
        return;
    }

    try {
        // Process all novels
        for (let i = 0; i < targets.length; i++) {
            console.log(`\n[${i + 1}/${targets.length}]`);
            const success = await processNovel(targets[i]);
            if (!success) {
                console.log('⚠️ Novel failed, continuing to next...');
            }
            await delay(3000);
        }

        console.log('\n🎉 Batch scraping to R2 completed!');

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
