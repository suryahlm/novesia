const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importRawNovels() {
    const translatedDir = path.join(__dirname, '..', 'scraper-data', 'data', 'translated', 'novels');

    const rawFiles = fs.readdirSync(translatedDir)
        .filter(f => f.endsWith('_raw.json'));

    console.log(`\n📚 Found ${rawFiles.length} raw novel files to import\n`);

    for (const file of rawFiles) {
        console.log(`\n🔄 Processing: ${file}`);
        const filePath = path.join(translatedDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Generate slug
        const slug = data.novel
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check if novel exists
        let novel = await prisma.novel.findUnique({ where: { slug } });

        if (!novel) {
            // Create novel
            novel = await prisma.novel.create({
                data: {
                    title: data.novel,
                    slug,
                    synopsis: 'No synopsis available',
                    cover: '',
                    author: 'Unknown',
                    status: 'COMPLETED',
                    isPremium: false,
                    language: 'id',
                    isManual: false,
                },
            });
            console.log(`  ✅ Created novel: ${data.novel}`);
        } else {
            console.log(`  ℹ️  Novel already exists: ${data.novel}`);
        }

        // Import chapters in batches of 50
        const BATCH_SIZE = 50;
        let importedCount = 0;

        for (let i = 0; i < data.chapters.length; i += BATCH_SIZE) {
            const batch = data.chapters.slice(i, i + BATCH_SIZE);

            for (const chapter of batch) {
                const chapterNumber = chapter.number;

                // Check if chapter exists
                const existing = await prisma.chapter.findUnique({
                    where: {
                        novelId_chapterNumber: {
                            novelId: novel.id,
                            chapterNumber,
                        },
                    },
                });

                if (existing) continue;

                // Clean content
                let cleanContent = (chapter.content || '')
                    .replace(/<div[^>]*>/gi, '')
                    .replace(/<\/div>/gi, '')
                    .replace(/<p[^>]*>/gi, '\n\n')
                    .replace(/<\/p>/gi, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .trim();

                if (cleanContent.length > 0) {
                    await prisma.chapter.create({
                        data: {
                            novelId: novel.id,
                            chapterNumber,
                            title: chapter.title || `Chapter ${chapterNumber}`,
                            contentTranslated: cleanContent,
                            contentOriginal: chapter.contentOriginal || null,
                            wordCount: cleanContent.split(/\s+/).length,
                            isPublished: true,
                            publishedAt: new Date(),
                        },
                    });
                    importedCount++;
                }
            }

            console.log(`  📝 Imported ${Math.min(i + BATCH_SIZE, data.chapters.length)}/${data.chapters.length} chapters`);
        }

        console.log(`  ✅ Total imported: ${importedCount} chapters`);
    }

    // Final stats
    const novelCount = await prisma.novel.count();
    const chapterCount = await prisma.chapter.count();

    console.log(`\n✅ Import Complete!`);
    console.log(`📊 Total Novels: ${novelCount}`);
    console.log(`📊 Total Chapters: ${chapterCount}\n`);
}

importRawNovels()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
