const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
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
const TRANSLATED_DIR = "./scraper-data/data/translated/novels";

// Helper: Upload JSON to R2
async function uploadJsonToR2(key, data) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: "application/json",
    });
    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

// Helper: Download image from URL
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        if (!url) return reject(new Error("No URL provided"));

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

// Helper: Upload image to R2
async function uploadImageToR2(key, buffer, contentType = "image/jpeg") {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

// Main upload function
async function uploadTranslatedNovels() {
    console.log("=".repeat(60));
    console.log("UPLOAD TRANSLATED NOVELS TO R2 (WITH FULL METADATA)");
    console.log("=".repeat(60));
    console.log(`Started at: ${new Date().toLocaleString()}`);

    // Get translated novel files
    const novelFiles = fs.readdirSync(TRANSLATED_DIR).filter((f) => f.endsWith(".json"));
    console.log(`Found ${novelFiles.length} translated novels\n`);

    for (const file of novelFiles) {
        const novelPath = path.join(TRANSLATED_DIR, file);
        console.log(`\n${"=".repeat(60)}`);
        console.log(`Processing: ${file}`);

        try {
            // Load novel data
            const novelData = JSON.parse(fs.readFileSync(novelPath, "utf8"));
            const chapters = novelData.chapters || [];

            // Extract novel ID from filename (e.g., "2137-Zombie-King..." -> 2137)
            const novelIdMatch = file.match(/^(\d+)/);
            if (!novelIdMatch) {
                console.log(`  ✗ Could not extract novel ID from filename`);
                continue;
            }
            const novelId = novelIdMatch[1];

            console.log(`  Novel ID: ${novelId}`);
            console.log(`  Title: ${novelData.title} (ENGLISH)`);
            console.log(`  Author: ${novelData.author || "Unknown"}`);
            console.log(`  Status: ${novelData.status || "ongoing"}`);
            console.log(`  Genres: ${(novelData.genres || []).join(", ") || "none"}`);
            console.log(`  Synopsis: ${novelData.synopsis ? "Yes (" + novelData.synopsis.length + " chars)" : "No"}`);
            console.log(`  Cover: ${novelData.cover ? "Yes" : "No"}`);
            console.log(`  Chapters: ${chapters.length}`);

            // 1. UPLOAD COVER IMAGE (if available)
            let coverUrl = "";
            if (novelData.cover) {
                try {
                    console.log(`  Downloading cover...`);
                    const imageBuffer = await downloadImage(novelData.cover);
                    if (imageBuffer.length > 1000) {
                        const ext = novelData.cover.includes(".png") ? "png" : "jpg";
                        coverUrl = await uploadImageToR2(`covers/${novelId}.${ext}`, imageBuffer, `image/${ext === "png" ? "png" : "jpeg"}`);
                        console.log(`  ✓ Cover uploaded: ${coverUrl}`);
                    }
                } catch (err) {
                    console.log(`  ⚠ Cover download failed: ${err.message}`);
                }
            }

            // 2. UPLOAD METADATA.JSON (full novel info)
            const metadata = {
                id: novelId,
                title: novelData.title, // ENGLISH - NOT TRANSLATED
                titleOriginal: novelData.titleOriginal || novelData.title,
                author: novelData.author || "Unknown",
                synopsis: novelData.synopsis || "",
                synopsisOriginal: novelData.synopsisOriginal || novelData.synopsis || "",
                status: novelData.status || "ongoing",
                genres: novelData.genres || [],
                cover: coverUrl || novelData.cover || "",
                totalChapters: chapters.length,
                sourceUrl: novelData.sourceUrl || "",
                uploadedAt: new Date().toISOString(),
            };

            await uploadJsonToR2(`novels/${novelId}/metadata.json`, metadata);
            console.log(`  ✓ Metadata uploaded: novels/${novelId}/metadata.json`);

            // 3. UPLOAD EACH CHAPTER
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                const chapterNumber = i + 1;

                const chapterData = {
                    number: chapterNumber,
                    title: chapter.title || `Chapter ${chapterNumber}`, // ENGLISH - NOT TRANSLATED
                    titleOriginal: chapter.titleOriginal || chapter.title,
                    content: chapter.content || "",
                    contentOriginal: chapter.contentOriginal || "",
                };

                const key = `novels/${novelId}/chapter-${chapterNumber}.json`;
                await uploadJsonToR2(key, chapterData);

                if ((i + 1) % 50 === 0) {
                    console.log(`  Progress: ${i + 1}/${chapters.length} chapters uploaded`);
                }
            }

            console.log(`  ✓ Novel ${novelId} complete: ${chapters.length} chapters + metadata + cover`);
        } catch (error) {
            console.error(`  ✗ Error:`, error.message);
        }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log("UPLOAD COMPLETE");
    console.log(`  Finished at: ${new Date().toLocaleString()}`);
    console.log("=".repeat(60));
}

// Run
uploadTranslatedNovels().catch(console.error);
