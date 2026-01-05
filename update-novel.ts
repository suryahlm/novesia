import { prisma } from './src/lib/prisma'

async function updateNovel() {
    try {
        // Find the novel first
        const novel = await prisma.novel.findFirst({
            where: {
                OR: [
                    { slug: 'novel-3564' },
                    { slug: { contains: '3564' } }
                ]
            }
        })

        if (!novel) {
            console.log('Novel not found. Checking all novels...')
            const allNovels = await prisma.novel.findMany({
                select: { id: true, slug: true, title: true }
            })
            console.log('All novels:', allNovels)
            return
        }

        console.log('Found novel:', novel.id, novel.slug)

        // Update the novel
        const updated = await prisma.novel.update({
            where: { id: novel.id },
            data: {
                title: 'Absolute Zero: Pemberontakan Kemampuan Sampah',
                originalTitle: 'Absolute Zero: The Rebellion of a Trash Ability',
                cover: 'https://www.asianovel.net/wp-content/uploads/2026/01/20251119212707_300_420.jpeg',
                slug: 'absolute-zero-pemberontakan-kemampuan-sampah',
            }
        })

        console.log('Updated successfully!')
        console.log('New data:', {
            id: updated.id,
            title: updated.title,
            slug: updated.slug,
            cover: updated.cover
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

updateNovel()
