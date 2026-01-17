// Upload ALL Local Covers to R2 and Update Database
// Run: node upload-local-covers.cjs

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// R2 Configuration
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
    console.log('🔧 Uploading Local Covers to R2...\n');

    const coversDir = path.join(__dirname, 'public', 'covers');

    if (!fs.existsSync(coversDir)) {
        console.log('❌ No public/covers directory found');
        return;
    }

    // Get all local cover files
    const files = fs.readdirSync(coversDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(`📁 Found ${files.length} cover files\n`);

    // Get all novels with local cover paths
    const result = await pool.query(`
        SELECT id, title, slug, cover 
        FROM "Novel" 
        WHERE cover LIKE '/covers/%' OR cover IS NULL
    `);

    console.log(`📚 Found ${result.rows.length} novels needing cover updates\n`);

    let updated = 0;
    let failed = 0;

    for (const novel of result.rows) {
        // Find matching cover file
        // Cover path is /covers/novel_3540.jpg or similar
        const currentPath = novel.cover;
        let filename = null;

        if (currentPath && currentPath.startsWith('/covers/')) {
            filename = path.basename(currentPath);
        } else {
            // Try to find by slug
            const bySlug = files.find(f => f.includes(novel.slug));
            if (bySlug) filename = bySlug;
        }

        if (!filename) {
            console.log(`⚠️ ${novel.title}: No cover file found`);
            failed++;
            continue;
        }

        const localPath = path.join(coversDir, filename);
        if (!fs.existsSync(localPath)) {
            console.log(`⚠️ ${novel.title}: File not found: ${filename}`);
            failed++;
            continue;
        }

        try {
            // Upload to R2
            const buffer = fs.readFileSync(localPath);
            const r2Key = `covers/${novel.slug}.jpg`;
            const r2Url = await uploadToR2(r2Key, buffer);

            // Update database
            await pool.query(
                'UPDATE "Novel" SET cover = $1, "updatedAt" = NOW() WHERE id = $2',
                [r2Url, novel.id]
            );

            console.log(`✅ ${novel.title}`);
            updated++;

        } catch (err) {
            console.log(`❌ ${novel.title}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n🎉 Done! Updated: ${updated}, Failed: ${failed}`);
    await pool.end();
}

main().catch(console.error);
