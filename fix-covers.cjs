const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { Pool } = require("pg");
const https = require("https");
const http = require("http");
require("dotenv").config();

// R2 Configuration
const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME || "novesia-assets";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-d7fdf7a6932b4febbd724bd48ae0c2c3.r2.dev";

const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
});

// Download image from URL with proper headers
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = url.startsWith("https") ? https : http;

        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "image/*,*/*",
            }
        };

        protocol.get(options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadImage(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
            res.on("error", reject);
        }).on("error", reject);
    });
}

// Upload to R2
async function uploadToR2(key, buffer, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

// Cover sources - multiple fallbacks
const novelCovers = [
    {
        slugPattern: "%i-want-to-be-a-good-person%",
        key: "covers/i-want-to-be-a-good-person.jpg",
        sources: [
            "https://www.asianovel.net/wp-content/uploads/2022/05/9375s-c5a5e7a140ea4f63ad19a1044c25dc441.jpg",
            "https://novelupdates.com/imgx/b7bf2b3a5a4a5c7d3a7a0b4e6a5c3a9a.jpg",
        ]
    },
    {
        slugPattern: "%burst%actor%",
        key: "covers/burst-the-actor.jpg",
        sources: [
            "https://www.asianovel.net/wp-content/uploads/2023/05/burst-the-actor.jpg",
            "https://www.asianovel.net/wp-content/uploads/2022/08/burst-actor-cover.jpg",
        ]
    }
];

async function fixCovers() {
    const client = await pool.connect();

    try {
        console.log("Fixing missing novel covers...\n");

        for (const novel of novelCovers) {
            console.log(`Processing: ${novel.key}`);

            let uploaded = false;
            let finalUrl = null;

            // Try each source URL
            for (const sourceUrl of novel.sources) {
                try {
                    console.log(`  Trying: ${sourceUrl.substring(0, 60)}...`);
                    const buffer = await downloadImage(sourceUrl);

                    if (buffer.length > 1000) { // Valid image
                        finalUrl = await uploadToR2(novel.key, buffer, "image/jpeg");
                        console.log(`  ✓ Uploaded to R2: ${finalUrl}`);
                        uploaded = true;
                        break;
                    }
                } catch (error) {
                    console.log(`  ✗ Failed: ${error.message}`);
                }
            }

            // If no source worked, create a placeholder
            if (!uploaded) {
                console.log(`  Creating placeholder...`);
                // Use existing R2 cover if available
                finalUrl = `${R2_PUBLIC_URL}/covers/placeholder.jpg`;
            }

            // Update database
            if (finalUrl) {
                const result = await client.query(
                    `UPDATE "Novel" SET cover = $1, "updatedAt" = NOW() WHERE slug LIKE $2 RETURNING title`,
                    [finalUrl, novel.slugPattern]
                );
                if (result.rows.length > 0) {
                    console.log(`  ✓ Updated DB: ${result.rows[0].title}\n`);
                }
            }
        }

        console.log("Done!");
    } finally {
        client.release();
        await pool.end();
    }
}

fixCovers().catch(console.error);
