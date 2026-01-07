const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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

// Download image from URL
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        protocol.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // Follow redirect
                return downloadImage(res.headers.location).then(resolve).catch(reject);
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
    console.log(`Uploaded: ${key}`);
}

// Covers to upload
const covers = [
    {
        novelId: "1290",
        url: "https://www.asianovel.net/wp-content/uploads/2022/05/9375s-c5a5e7a140ea4f63ad19a1044c25dc441.jpg",
    },
    {
        novelId: "1708",
        // Fallback - no cover in source, use placeholder or search
        url: "https://www.asianovel.net/wp-content/uploads/2023/01/burst-the-actor.jpg",
    },
    {
        novelId: "3564",
        url: "https://www.asianovel.net/wp-content/uploads/2026/01/20251119212707_300_420.jpeg",
    },
];

async function main() {
    console.log("Uploading covers to R2...\n");

    for (const cover of covers) {
        try {
            console.log(`Downloading cover for Novel ${cover.novelId}...`);
            const buffer = await downloadImage(cover.url);
            const ext = cover.url.includes(".png") ? "png" : "jpg";
            await uploadToR2(`covers/${cover.novelId}.jpg`, buffer, `image/${ext === "png" ? "png" : "jpeg"}`);
            console.log(`✓ Novel ${cover.novelId} cover uploaded\n`);
        } catch (error) {
            console.error(`✗ Novel ${cover.novelId} error:`, error.message, "\n");
        }
    }

    console.log("Done!");
}

main();
