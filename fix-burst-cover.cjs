// Fix cover for Burst the Actor novel
require('dotenv').config();
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'novesia-assets';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d7fdf7a6932b4febbd724bd48ae0c2c3.r2.dev';

async function downloadImage(url) {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
}

async function uploadToR2(key, buffer) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
    });
    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

async function main() {
    console.log('🔍 Finding novel...\n');

    // Find the novel
    const result = await pool.query(`
        SELECT id, title, slug, cover, "sourceUrl" 
        FROM "Novel" 
        WHERE title LIKE '%Burst%Actor%'
    `);

    if (result.rows.length === 0) {
        console.log('❌ Novel not found');
        await pool.end();
        return;
    }

    const novel = result.rows[0];
    console.log(`📚 Found: ${novel.title}`);
    console.log(`   Slug: ${novel.slug}`);
    console.log(`   Current cover: ${novel.cover || 'NONE'}`);
    console.log(`   Source: ${novel.sourceUrl}`);

    // Try to get cover from source page
    if (novel.sourceUrl) {
        console.log('\n🔄 Fetching cover from source...');

        try {
            // Known cover URL for this novel (from asianovel)
            const coverUrls = [
                'https://www.asianovel.net/wp-content/uploads/2023/01/burst-the-actor-was-won-by-the-newcomer.jpg',
                'https://www.asianovel.net/wp-content/uploads/2023/01/burst-actor.jpg',
                'https://www.asianovel.net/wp-content/uploads/2022/08/burst-actor-cover.jpg',
            ];

            let buffer = null;
            for (const url of coverUrls) {
                try {
                    console.log(`   Trying: ${url.substring(0, 60)}...`);
                    buffer = await downloadImage(url);
                    if (buffer.length > 1000) {
                        console.log(`   ✓ Downloaded (${buffer.length} bytes)`);
                        break;
                    }
                } catch (e) {
                    console.log(`   ✗ ${e.message}`);
                }
            }

            if (buffer) {
                const r2Key = `covers/${novel.slug}.jpg`;
                const r2Url = await uploadToR2(r2Key, buffer);
                console.log(`   📤 Uploaded to R2: ${r2Url}`);

                // Update database
                await pool.query(
                    'UPDATE "Novel" SET cover = $1, "updatedAt" = NOW() WHERE id = $2',
                    [r2Url, novel.id]
                );
                console.log('   ✅ Database updated!');
            } else {
                console.log('   ❌ Could not download any cover');
            }

        } catch (err) {
            console.error('Error:', err.message);
        }
    }

    await pool.end();
}

main();
