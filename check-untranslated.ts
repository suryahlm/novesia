// Check for untranslated chapters in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUntranslatedContent() {
    try {
        console.log('🔍 Checking database for untranslated content...\n');

        // 1. Count total chapters
        const totalChapters = await prisma.chapter.count();
        console.log(`📚 Total chapters in database: ${totalChapters}`);

        // 2. Count chapters without Indonesian translation
        const untranslatedChapters = await prisma.chapter.count({
            where: {
                OR: [
                    { contentIndonesian: null },
                    { contentIndonesian: '' }
                ]
            }
        });
        console.log(`❌ Chapters without translation: ${untranslatedChapters}`);
        console.log(`✅ Chapters with translation: ${totalChapters - untranslatedChapters}`);

        // 3. Get sample of untranslated chapters
        if (untranslatedChapters > 0) {
            console.log('\n📖 Sample untranslated chapters:');
            const samples = await prisma.chapter.findMany({
                where: {
                    OR: [
                        { contentIndonesian: null },
                        { contentIndonesian: '' }
                    ]
                },
                take: 5,
                include: {
                    novel: {
                        select: {
                            title: true
                        }
                    }
                }
            });

            samples.forEach((ch, i) => {
                console.log(`\n${i + 1}. ${ch.novel.title} - Chapter ${ch.chapterNumber}`);
                console.log(`   Title: ${ch.title}`);
                console.log(`   Content preview: ${ch.content?.substring(0, 100) || 'No content'}...`);
            });
        }

        // 4. Check novels status
        const novels = await prisma.novel.findMany({
            select: {
                id: true,
                title: true,
                _count: {
                    select: {
                        chapters: true
                    }
                }
            }
        });

        console.log(`\n📚 Total novels: ${novels.length}`);
        novels.forEach(novel => {
            console.log(`- ${novel.title}: ${novel._count.chapters} chapters`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUntranslatedContent();
