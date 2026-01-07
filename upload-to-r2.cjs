const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
const TRANSLATED_DIR = "./scraper-data/data/translated/novels";

// Helper: Upload to R2
async function uploadToR2(key, data) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: "application/json",
    });
    await r2Client.send(command);
    console.log(`  Uploaded: ${key}`);
}

// Main function
async function uploadTranslatedNovels() {
    console.log("=".repeat(60));
    console.log("UPLOAD TRANSLATED NOVELS TO R2");
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

            // Extract novel ID from filename (e.g., "1290-I-Want-To..." -> 1290)
            const novelIdMatch = file.match(/^(\d+)/);
            if (!novelIdMatch) {
                console.log(`  ✗ Could not extract novel ID from filename`);
                continue;
            }
            const novelId = novelIdMatch[1];

            console.log(`  Novel ID: ${novelId}`);
            console.log(`  Title: ${novelData.title}`);
            console.log(`  Chapters: ${chapters.length}`);

            // Upload each chapter
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                const chapterNumber = i + 1;

                const chapterData = {
                    number: chapterNumber,
                    title: chapter.title || `Chapter ${chapterNumber}`,
                    originalTitle: chapter.titleOriginal || chapter.title,
                    content: chapter.content || chapter.contentTranslated || "",
                };

                const key = `novels/${novelId}/chapter-${chapterNumber}.json`;
                await uploadToR2(key, chapterData);

                if ((i + 1) % 50 === 0) {
                    console.log(`  Progress: ${i + 1}/${chapters.length} chapters uploaded`);
                }
            }

            console.log(`  ✓ Novel ${novelId} uploaded (${chapters.length} chapters)`);
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
