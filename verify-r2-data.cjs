// Verify R2 Metadata and Covers
// Checks all raw-novels in R2 for missing metadata.json or cover
// Run: node verify-r2-data.cjs

require('dotenv').config();
const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');

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

async function listNovels() {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: 'raw-novels/',
        Delimiter: '/',
    });

    const result = await r2Client.send(command);
    const folders = result.CommonPrefixes || [];
    return folders.map(f => f.Prefix.replace('raw-novels/', '').replace('/', ''));
}

async function checkObject(key) {
    try {
        await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch (err) {
        return false;
    }
}

async function main() {
    console.log('🔍 Verifying R2 Metadata and Covers...\n');

    const novels = await listNovels();
    console.log(`📚 Found ${novels.length} novels in R2\n`);

    const issues = [];
    const complete = [];

    for (const slug of novels) {
        if (!slug || slug === '_test') continue;

        const metadataKey = `raw-novels/${slug}/metadata.json`;
        const coverKey = `raw-novels/${slug}/cover.jpg`;

        const hasMetadata = await checkObject(metadataKey);
        const hasCover = await checkObject(coverKey);

        if (hasMetadata && hasCover) {
            process.stdout.write('✓');
            complete.push(slug);
        } else {
            process.stdout.write('✗');
            issues.push({
                slug,
                missingMetadata: !hasMetadata,
                missingCover: !hasCover,
            });
        }
    }

    console.log('\n\n');
    console.log('📊 Results:');
    console.log(`   ✅ Complete: ${complete.length}`);
    console.log(`   ❌ Issues: ${issues.length}`);

    if (issues.length > 0) {
        console.log('\n📋 Novels with issues:');
        issues.forEach(i => {
            const missing = [];
            if (i.missingMetadata) missing.push('metadata.json');
            if (i.missingCover) missing.push('cover.jpg');
            console.log(`   - ${i.slug}: missing ${missing.join(', ')}`);
        });
    }

    // Save issues to file
    if (issues.length > 0) {
        require('fs').writeFileSync('r2-issues.json', JSON.stringify(issues, null, 2));
        console.log('\n📁 Issues saved to r2-issues.json');
    }
}

main().catch(console.error);
