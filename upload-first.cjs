const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

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

async function uploadJsonToR2(key, data) {
    const command = new PutObjectCommand({
        Bucket: BUCKET, Key: key, Body: JSON.stringify(data), ContentType: "application/json",
    });
    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        if (!url) return reject(new Error("No URL"));
        const protocol = url.startsWith("https") ? https : http;
        protocol.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) return downloadImage(res.headers.location).then(resolve).catch(reject);
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => resolve(Buffer.concat(chunks))); res.on("error", reject);
        }).on("error", reject);
    });
}

async function uploadImageToR2(key, buffer) {
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: "image/jpeg" });
    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

async function main() {
    console.log("Uploading Novel 2137 to R2...");
    const file = "./scraper-data/data/translated/novels/2137-Zombie-King-is-on-the-hot-search-again-with-his-cu.json";
    const novelData = JSON.parse(fs.readFileSync(file, "utf8"));
    const novelId = "2137";
    
    // Upload cover
    let coverUrl = "";
    if (novelData.cover) {
        try {
            const img = await downloadImage(novelData.cover);
            if (img.length > 1000) { coverUrl = await uploadImageToR2(`covers/${novelId}.jpg`, img); console.log("Cover uploaded"); }
        } catch (e) { console.log("Cover failed:", e.message); }
    }
    
    // Upload metadata
    const metadata = { id: novelId, title: novelData.title, author: novelData.author, synopsis: novelData.synopsis || "", status: novelData.status, genres: novelData.genres || [], cover: coverUrl || novelData.cover, totalChapters: novelData.chapters.length };
    await uploadJsonToR2(`novels/${novelId}/metadata.json`, metadata);
    console.log("Metadata uploaded");
    
    // Upload chapters
    for (let i = 0; i < novelData.chapters.length; i++) {
        const ch = novelData.chapters[i];
        await uploadJsonToR2(`novels/${novelId}/chapter-${i+1}.json`, { number: i+1, title: ch.title, content: ch.content });
        if ((i+1) % 10 === 0) console.log(`${i+1}/${novelData.chapters.length} chapters`);
    }
    console.log("Done! Novel 2137 uploaded to R2");
}
main().catch(console.error);
