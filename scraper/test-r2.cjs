// Test R2 Upload
require('dotenv').config({ path: '../.env' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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

async function testUpload() {
    console.log('🧪 Testing R2 Upload...');
    console.log(`📦 Bucket: ${R2_BUCKET_NAME}`);
    console.log(`🔗 Endpoint: ${R2_ENDPOINT}`);

    try {
        const testContent = JSON.stringify({
            test: true,
            timestamp: new Date().toISOString(),
            message: 'R2 upload test successful!'
        }, null, 2);

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: 'raw-novels/_test/test.json',
            Body: testContent,
            ContentType: 'application/json',
        });

        await r2Client.send(command);
        console.log('✅ R2 upload test successful!');
        console.log('📂 Uploaded to: raw-novels/_test/test.json');

    } catch (err) {
        console.error('❌ R2 upload failed:', err.message);
    }
}

testUpload();
