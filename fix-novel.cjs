/**
 * Fix single novel import
 */
const fs = require('fs');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

async function run() {
    const client = await pool.connect();
    const data = JSON.parse(fs.readFileSync('./scraper-data/data/translated/novels/3342-After-Transmigrating-Into-a-Green-Tea--I-Became-th.json'));
    const slug = 'after-transmigrating-into-a-green-tea-i-became-the-groups-darling';

    // Check exists and delete if so
    const existing = await client.query('SELECT id FROM "Novel" WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
        console.log('Deleting existing...');
        await client.query('DELETE FROM "Novel" WHERE slug = $1', [slug]);
    }

    // Upload cover
    let coverUrl = data.cover;
    try {
        const resp = await fetch(coverUrl);
        const buf = Buffer.from(await resp.arrayBuffer());
        await r2Client.send(new PutObjectCommand({
            Bucket: 'novesia-assets',
            Key: 'covers/' + slug + '.jpg',
            Body: buf,
            ContentType: 'image/jpeg'
        }));
        coverUrl = 'https://novesia.vercel.app/api/cdn/covers/' + slug + '.jpg';
        console.log('Cover uploaded');
    } catch (e) {
        console.log('Cover failed:', e.message);
    }

    // Insert novel
    const res = await client.query(`
        INSERT INTO "Novel" (id, title, slug, synopsis, cover, author, status, "totalViews", "avgRating", "ratingCount", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 0, 0, 0, NOW(), NOW())
        RETURNING id
    `, [data.title, slug, data.synopsis || '', coverUrl, data.author || 'Unknown', 'COMPLETED']);

    const novelId = res.rows[0].id;
    console.log('Novel inserted:', data.title);

    // Insert chapters
    let count = 0;
    for (let i = 0; i < data.chapters.length; i++) {
        const ch = data.chapters[i];
        if (!ch) {
            console.log('Skipping null chapter at index', i);
            continue;
        }
        await client.query(`
            INSERT INTO "Chapter" (id, "novelId", "chapterNumber", title, "contentOriginal", "contentTranslated", "wordCount", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [novelId, i + 1, ch.title || 'Chapter ' + (i + 1), ch.contentOriginal || null, ch.content || '', (ch.content || '').split(/\s+/).length]);
        count++;
    }
    console.log('Inserted', count, 'chapters');

    client.release();
    await pool.end();
    console.log('DONE!');
}

run().catch(e => { console.error(e); process.exit(1); });
