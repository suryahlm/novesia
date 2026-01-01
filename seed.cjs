require("dotenv").config();

const { PrismaClient, NovelStatus } = require("./src/generated/prisma");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL,
        },
    },
});

async function main() {
    console.log("🌱 Seeding database...");

    // Create genres
    const genres = [
        { name: "Action", slug: "action", icon: "⚔️" },
        { name: "Romance", slug: "romance", icon: "💕" },
        { name: "Fantasy", slug: "fantasy", icon: "🧙" },
        { name: "Cultivation", slug: "cultivation", icon: "🏔️" },
        { name: "Sci-Fi", slug: "sci-fi", icon: "🚀" },
        { name: "Horror", slug: "horror", icon: "👻" },
        { name: "Mystery", slug: "mystery", icon: "🔍" },
        { name: "Slice of Life", slug: "slice-of-life", icon: "☕" },
        { name: "Comedy", slug: "comedy", icon: "😂" },
        { name: "Drama", slug: "drama", icon: "🎭" },
    ];

    for (const genre of genres) {
        await prisma.genre.upsert({
            where: { slug: genre.slug },
            update: {},
            create: genre,
        });
    }
    console.log("✅ Genres created");

    // Create sample novels
    const novels = [
        {
            title: "The Beginning After The End",
            slug: "the-beginning-after-the-end",
            synopsis: "Raja Arthur Leywin telah meninggal dalam kehidupan sebelumnya, tetapi terlahir kembali di dunia baru yang penuh dengan sihir dan monster.",
            cover: "https://picsum.photos/seed/tbate/300/450",
            author: "TurtleMe",
            status: "ONGOING",
            isPremium: true,
            totalViews: 125000,
            avgRating: 4.9,
            ratingCount: 2500,
            genres: ["action", "fantasy"],
        },
        {
            title: "Solo Leveling",
            slug: "solo-leveling",
            synopsis: "Sung Jin-Woo adalah hunter terlemah di Korea yang mendapatkan kekuatan misterius untuk naik level.",
            cover: "https://picsum.photos/seed/solo/300/450",
            author: "Chugong",
            status: "COMPLETED",
            isPremium: false,
            totalViews: 98000,
            avgRating: 4.8,
            ratingCount: 3200,
            genres: ["action", "fantasy"],
        },
        {
            title: "Omniscient Reader's Viewpoint",
            slug: "omniscient-readers-viewpoint",
            synopsis: "Kim Dokja adalah satu-satunya pembaca yang menyelesaikan web novel apokaliptik.",
            cover: "https://picsum.photos/seed/orv/300/450",
            author: "Sing Shong",
            status: "COMPLETED",
            isPremium: false,
            totalViews: 87000,
            avgRating: 4.7,
            ratingCount: 1800,
            genres: ["action", "fantasy", "mystery"],
        },
        {
            title: "Lord of Mysteries",
            slug: "lord-of-mysteries",
            synopsis: "Zhou Mingrui terbangun di dunia era Victoria yang dipenuhi misteri dan kekuatan supranatural.",
            cover: "https://picsum.photos/seed/lom/300/450",
            author: "Cuttlefish That Loves Diving",
            status: "COMPLETED",
            isPremium: true,
            totalViews: 78000,
            avgRating: 4.9,
            ratingCount: 2100,
            genres: ["mystery", "fantasy", "horror"],
        },
        {
            title: "Shadow Slave",
            slug: "shadow-slave",
            synopsis: "Sunny terjebak di Realm Mimpi, dunia penuh nightmare dan monster.",
            cover: "https://picsum.photos/seed/shadow/300/450",
            author: "Guiltythree",
            status: "ONGOING",
            isPremium: false,
            totalViews: 42000,
            avgRating: 4.8,
            ratingCount: 980,
            genres: ["action", "fantasy", "horror"],
        },
    ];

    for (const novel of novels) {
        const { genres: genreSlugs, ...novelData } = novel;
        await prisma.novel.upsert({
            where: { slug: novel.slug },
            update: {},
            create: {
                ...novelData,
                genres: {
                    connect: genreSlugs.map((slug) => ({ slug })),
                },
            },
        });
    }
    console.log("✅ Novels created");

    // Create sample chapters
    const tbate = await prisma.novel.findUnique({
        where: { slug: "the-beginning-after-the-end" },
    });

    if (tbate) {
        const chapters = [
            { chapterNumber: 1, title: "Kelahiran Kembali", contentTranslated: "Arthur Leywin membuka matanya...", wordCount: 150 },
            { chapterNumber: 2, title: "Keluarga Baru", contentTranslated: "Bulan-bulan berlalu...", wordCount: 140 },
            { chapterNumber: 3, title: "Bakat Tersembunyi", contentTranslated: "Reynolds, lihat ini!...", wordCount: 135 },
        ];

        for (const chapter of chapters) {
            await prisma.chapter.upsert({
                where: {
                    novelId_chapterNumber: {
                        novelId: tbate.id,
                        chapterNumber: chapter.chapterNumber,
                    },
                },
                update: {},
                create: { ...chapter, novelId: tbate.id },
            });
        }
        console.log("✅ Sample chapters created");
    }

    console.log("🎉 Seeding completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
