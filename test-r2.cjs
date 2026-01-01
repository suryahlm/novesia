require('dotenv').config();
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

console.log('=== R2 Connection Test ===');
console.log('Endpoint:', process.env.R2_ENDPOINT);
console.log('Bucket:', process.env.R2_BUCKET_NAME);
console.log('Access Key (first 10):', process.env.R2_ACCESS_KEY_ID?.substring(0, 10) + '...');

const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function testConnection() {
    try {
        // Test 1: Upload a simple text file
        console.log('\n--- Test 1: Upload Text File ---');
        const putCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'novesia-assets',
            Key: 'test/hello.txt',
            Body: 'Hello from Novesia! ' + new Date().toISOString(),
            ContentType: 'text/plain',
        });

        await client.send(putCommand);
        console.log('✅ Upload SUCCESS!');
        console.log('URL:', process.env.R2_PUBLIC_URL + '/test/hello.txt');

        // Test 2: List objects
        console.log('\n--- Test 2: List Objects ---');
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME || 'novesia-assets',
            MaxKeys: 5,
        });

        const listResult = await client.send(listCommand);
        console.log('Objects in bucket:', listResult.KeyCount || 0);
        if (listResult.Contents) {
            listResult.Contents.forEach(obj => {
                console.log(' -', obj.Key, '(' + obj.Size + ' bytes)');
            });
        }

    } catch (error) {
        console.log('\n❌ ERROR:', error.name);
        console.log('Message:', error.message);
        if (error.$metadata) {
            console.log('HTTP Status:', error.$metadata.httpStatusCode);
        }
        if (error.Code) {
            console.log('Error Code:', error.Code);
        }
    }
}

testConnection();
