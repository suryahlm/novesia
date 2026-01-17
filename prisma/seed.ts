import "dotenv/config"
import { PrismaClient, NovelStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding database...")

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
    ]

    for (const genre of genres) {
        await prisma.genre.upsert({
            where: { slug: genre.slug },
            update: {},
            create: genre,
        })
    }
    console.log("✅ Genres created")

    // Create admin user
    const bcrypt = require("bcryptjs")
    const adminEmail = "admin@novesia.com"
    const adminPassword = await bcrypt.hash("admin123", 10)

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: adminPassword,
            name: "Admin Novesia",
            role: "ADMIN",
            coins: 10000,
            isVip: true,
        },
    })
    console.log("✅ Admin user created (email: admin@novesia.com, password: admin123)")

    // Create sample novels
    const novels = [
        {
            title: "The Beginning After The End",
            slug: "the-beginning-after-the-end",
            synopsis: "Raja Arthur Leywin telah meninggal dalam kehidupan sebelumnya, tetapi terlahir kembali di dunia baru yang penuh dengan sihir dan monster. Dengan ingatan kehidupan lamanya yang masih utuh, ia bertekad untuk melindungi orang-orang yang dicintainya dari ancaman yang akan datang.",
            cover: "https://picsum.photos/seed/tbate/300/450",
            author: "TurtleMe",
            status: NovelStatus.ONGOING,
            isPremium: true,
            totalViews: 125000,
            avgRating: 4.9,
            ratingCount: 2500,
            genres: ["action", "fantasy"],
        },
        {
            title: "Solo Leveling",
            slug: "solo-leveling",
            synopsis: "Sung Jin-Woo adalah hunter terlemah di Korea. Suatu hari, ia hampir mati di sebuah dungeon berbahaya dan mendapatkan kekuatan misterius yang memungkinkannya naik level seperti dalam game. Dengan kekuatan barunya, ia bertekad menjadi hunter terkuat di dunia.",
            cover: "https://picsum.photos/seed/solo/300/450",
            author: "Chugong",
            status: NovelStatus.COMPLETED,
            isPremium: false,
            totalViews: 98000,
            avgRating: 4.8,
            ratingCount: 3200,
            genres: ["action", "fantasy"],
        },
        {
            title: "Omniscient Reader's Viewpoint",
            slug: "omniscient-readers-viewpoint",
            synopsis: "Kim Dokja adalah satu-satunya pembaca yang menyelesaikan web novel 'Three Ways to Survive the Apocalypse'. Ketika dunia tiba-tiba berubah menjadi seperti novel tersebut, hanya dia yang tahu bagaimana cerita akan berakhir.",
            cover: "https://picsum.photos/seed/orv/300/450",
            author: "Sing Shong",
            status: NovelStatus.COMPLETED,
            isPremium: false,
            totalViews: 87000,
            avgRating: 4.7,
            ratingCount: 1800,
            genres: ["action", "fantasy", "mystery"],
        },
        {
            title: "Lord of Mysteries",
            slug: "lord-of-mysteries",
            synopsis: "Zhou Mingrui terbangun di dunia era Victoria yang dipenuhi misteri dan kekuatan supranatural. Ia menemukan dirinya dalam tubuh seorang pemuda bernama Klein Moretti dan harus mengungkap rahasia di balik kematiannya.",
            cover: "https://picsum.photos/seed/lom/300/450",
            author: "Cuttlefish That Loves Diving",
            status: NovelStatus.COMPLETED,
            isPremium: true,
            totalViews: 78000,
            avgRating: 4.9,
            ratingCount: 2100,
            genres: ["mystery", "fantasy", "horror"],
        },
        {
            title: "Shadow Slave",
            slug: "shadow-slave",
            synopsis: "Sunny adalah seorang budak yang terjebak di Realm Mimpi, dunia penuh nightmare dan monster. Untuk bertahan hidup dan mendapatkan kebebasan, ia harus menaklukkan Shadow Core dan menjadi Shadow Master.",
            cover: "https://picsum.photos/seed/shadow/300/450",
            author: "Guiltythree",
            status: NovelStatus.ONGOING,
            isPremium: false,
            totalViews: 42000,
            avgRating: 4.8,
            ratingCount: 980,
            genres: ["action", "fantasy", "horror"],
        },
        {
            title: "Martial Peak",
            slug: "martial-peak",
            synopsis: "Yang Kai adalah murid biasa di High Heaven Pavilion sampai ia menemukan buku hitam misterius. Buku tersebut membawanya ke jalan kultivasi yang tak terbayangkan, dari dunia rendah hingga puncak dunia kultivator.",
            cover: "https://picsum.photos/seed/martial/300/450",
            author: "Momo",
            status: NovelStatus.COMPLETED,
            isPremium: false,
            totalViews: 95000,
            avgRating: 4.4,
            ratingCount: 4500,
            genres: ["action", "cultivation"],
        },
        {
            title: "I Shall Seal the Heavens",
            slug: "i-shall-seal-the-heavens",
            synopsis: "Meng Hao adalah seorang sarjana miskin yang dipaksa bergabung dengan sekte kultivasi. Dengan kecerdasan dan tekadnya, ia perlahan naik dari bawah menuju puncak dunia kultivasi.",
            cover: "https://picsum.photos/seed/issth/300/450",
            author: "Er Gen",
            status: NovelStatus.COMPLETED,
            isPremium: false,
            totalViews: 67000,
            avgRating: 4.7,
            ratingCount: 2800,
            genres: ["cultivation", "fantasy"],
        },
        {
            title: "My Wife is a Beautiful CEO",
            slug: "my-wife-is-a-beautiful-ceo",
            synopsis: "Yang Chen, mantan pemimpin organisasi pembunuh legendaris, kembali ke kehidupan normal dan menikah dengan CEO cantik Lin Ruoxi. Kehidupan barunya penuh dengan drama, romance, dan aksi.",
            cover: "https://picsum.photos/seed/ceo/300/450",
            author: "Cabbage Flatbread",
            status: NovelStatus.COMPLETED,
            isPremium: false,
            totalViews: 65000,
            avgRating: 4.5,
            ratingCount: 1200,
            genres: ["romance", "action", "comedy"],
        },
        {
            title: "Emperor's Domination",
            slug: "emperors-domination",
            synopsis: "Li Qiye adalah Crow Hitam yang telah hidup selama jutaan tahun, membimbing Immortal Emperors menuju puncak. Kini ia terlahir kembali sebagai manusia dan siap merebut takdir untuk dirinya sendiri.",
            cover: "https://picsum.photos/seed/emperor/300/450",
            author: "Yan Bi Xiao Sheng",
            status: NovelStatus.ONGOING,
            isPremium: true,
            totalViews: 54000,
            avgRating: 4.6,
            ratingCount: 1500,
            genres: ["cultivation", "action"],
        },
        {
            title: "Rebirth of the Urban Immortal Cultivator",
            slug: "rebirth-urban-immortal",
            synopsis: "Chen Fan, seorang Immortal Cultivator yang gagal, terlahir kembali ke masa SMA-nya. Dengan pengetahuan dari kehidupan sebelumnya, ia bertekad memperbaiki kesalahannya dan melindungi keluarganya.",
            cover: "https://picsum.photos/seed/rebirth/300/450",
            author: "Ten Miles Sword God",
            status: NovelStatus.ONGOING,
            isPremium: false,
            totalViews: 38000,
            avgRating: 4.3,
            ratingCount: 780,
            genres: ["cultivation", "romance", "action"],
        },
    ]

    for (const novel of novels) {
        const { genres: genreSlugs, ...novelData } = novel
        await prisma.novel.upsert({
            where: { slug: novel.slug },
            update: {},
            create: {
                ...novelData,
                genres: {
                    connect: genreSlugs.map((slug) => ({ slug })),
                },
            },
        })
    }
    console.log("✅ Novels created")

    // Create sample chapters for first novel
    const tbate = await prisma.novel.findUnique({
        where: { slug: "the-beginning-after-the-end" },
    })

    if (tbate) {
        const chapters = [
            {
                chapterNumber: 1,
                title: "Kelahiran Kembali",
                contentTranslated: `Arthur Leywin membuka matanya dan menemukan dirinya dalam tubuh bayi. Ia adalah seorang raja di kehidupan sebelumnya, penguasa benua Dicathen yang tak terkalahkan. Kini, ia terlahir kembali di dunia baru yang penuh dengan sihir.\n\n"Ini... di mana aku?" pikirnya, berusaha menggerakkan tubuh kecilnya yang baru.\n\nIa masih bisa merasakan ingatan kehidupan lamanya - pelatihan keras, pertempuran brutal, dan akhir yang tragis. Tapi sekarang, ia diberi kesempatan kedua.\n\n"Kali ini, aku akan melindungi semua orang yang kucintai," ia berjanji dalam hati.`,
                wordCount: 150,
            },
            {
                chapterNumber: 2,
                title: "Keluarga Baru",
                contentTranslated: `Bulan-bulan berlalu, dan Arthur mulai terbiasa dengan kehidupan barunya. Kedua orang tuanya, Reynolds dan Alice Leywin, adalah petualang yang penuh kasih sayang.\n\n"Art, lihat! Ibu membawakan mainan untukmu!" Alice tersenyum lembut sambil menggendong putranya.\n\nArthur, dalam tubuh balitanya, hanya bisa tersenyum. Di dalam hatinya, ia berterima kasih atas kesempatan kedua ini.\n\nIa mulai melatih mana secara diam-diam, memanfaatkan pengetahuan dari kehidupan lamanya. Di usia 3 tahun, ia sudah bisa memanipulasi elemen dasar - sesuatu yang seharusnya mustahil untuk anak seusianya.`,
                wordCount: 140,
            },
            {
                chapterNumber: 3,
                title: "Bakat Tersembunyi",
                contentTranslated: `"Reynolds, lihat ini!" Alice berbisik dengan mata terbelalak.\n\nDi halaman belakang, Arthur kecil sedang bermain dengan bola api kecil yang melayang di telapak tangannya. Ia berputar dan menari dengan api, seolah sudah melakukannya ribuan kali.\n\n"Ini... tidak mungkin," Reynolds bergumam. "Dia baru berusia 3 tahun!"\n\nArthur menyadari tatapan orang tuanya dan segera menghilangkan api. Ia memasang wajah polos.\n\n"Maaf, Ayah, Ibu... Art hanya bermain..."\n\nReynolds dan Alice saling pandang. Mereka tahu putra mereka istimewa, tapi ini melampaui semua ekspektasi mereka.`,
                wordCount: 135,
            },
        ]

        for (const chapter of chapters) {
            await prisma.chapter.upsert({
                where: {
                    novelId_chapterNumber: {
                        novelId: tbate.id,
                        chapterNumber: chapter.chapterNumber,
                    },
                },
                update: {},
                create: {
                    ...chapter,
                    novelId: tbate.id,
                    isPublished: true,
                    publishedAt: new Date(),
                },
            })
        }
        console.log("✅ Sample chapters created for TBATE")
    }

    console.log("🎉 Seeding completed!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
