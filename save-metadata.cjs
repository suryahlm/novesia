/**
 * Batch save metadata to all novel JSON files
 */
const fs = require('fs');
const path = require('path');

const METADATA = {
    lmw: {
        titleEnglish: "The Legendary Master's Wife",
        titleOriginal: "传说之主的夫人",
        author: "Yin Ya (尹琊)",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/2017/05/32.jpg",
        genres: ["Action", "Adventure", "Fantasy", "Comedy", "Historical", "Martial Art", "Romance", "BL"],
        status: "Completed",
        synopsis: "After an explosion, You XiaoMo finds himself as a probationary disciple of the TianXin sect with dubious potential. Faced with the threat of being driven out if he can't produce results, he works hard making medicines and earning money. Along the way, he encounters the terrifying Ling Xiao.",
        source: "Exiled Rebels Scanlations"
    },
    spirithotel: {
        titleEnglish: "Spirit Hotel",
        titleOriginal: "幽灵酒店",
        author: "酥油饼 (Su You Bing)",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/Spirit-Hotel-Su-You-Bing.jpg",
        genres: ["Fantasy", "Supernatural", "Comedy", "BL"],
        status: "Completed",
        synopsis: "After being unemployed for a long time, Feisha Shi finally found a new job – the front desk manager at the oldest hotel in the universe. This hotel has a fallen angel, vampire, werewolf, faerie, dwarf, titan, invisible person… just no humans. The hotel's name is Noah's Ark.",
        source: "Exiled Rebels Scanlations"
    },
    heand: {
        titleEnglish: "He and It",
        titleOriginal: "他与它",
        author: "Lady Lotus Crane (莲鹤夫人)",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/He-and-It.jpg",
        genres: ["BL", "Short Stories", "Supernatural", "Romance"],
        status: "Completed",
        synopsis: "A collection of 6 short novels/stories featuring non-humans (mermaids, gods, otters, etc.) that can be read independently, each with very different styles.",
        source: "Exiled Rebels Scanlations"
    },
    quicktrans: {
        titleEnglish: "Quick Transmigration: Lovers Always on the Counterattack",
        titleOriginal: "快穿之爱人总在逆袭中",
        author: "Mijia",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/LACcover.jpg",
        genres: ["Fantasy", "Romance", "Action", "Quick Transmigration", "Omegaverse", "BL"],
        status: "Completed",
        synopsis: "Bai Duan travels through countless worlds with his lover, losing his memories each time. His lover, who remembers everything, waits patiently for Bai Duan to fall in love with him again in every new world.",
        source: "Exiled Rebels Scanlations"
    },
    genius: {
        titleEnglish: "The Genius' Playbook",
        titleOriginal: "天才攻略论",
        author: "Li Wenzhou (李温酒)",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/download-6.jpg",
        genres: ["BL", "Gaming", "Holographic", "Future", "Friends to Lovers"],
        status: "Completed",
        synopsis: "Genius Su Mo, with an F-grade physique, was unable to join the Star Network Era until a new holographic game, 'Celestial Horizon', broke those limitations. Known as the archdemon 'Momo', he dominates the game while maintaining strictly 'healthy' gaming hours.",
        source: "Exiled Rebels Scanlations"
    },
    beaststore: {
        titleEnglish: "Cute Beast Store No. 138",
        titleOriginal: "138号异兽萌宠店",
        author: "Dǎ JiāngShī",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/58072s-1.jpg",
        genres: ["BL", "Fluff", "Drama", "Fantasy", "Supernatural", "Beasts"],
        status: "Completed",
        synopsis: "Jinyu, a survivor from an apocalyptic Earth who understands beast language, transmigrates 100,000 years into a future where 'pure' humans are extinct and beasts rule. As the last pure human, he finds a place for himself at Beast Store No. 138.",
        source: "Exiled Rebels Scanlations"
    },
    farming: {
        titleEnglish: "Farming Together with Interstellar People",
        titleOriginal: "和星际人民一起种田",
        author: "Sleeping Kitten (猫眠儿)",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/Farming-WIth-the-Interstellar-People-1.jpg",
        genres: ["BL", "Interstellar", "Farming", "Game"],
        status: "Completed",
        synopsis: "Reborn in a land-scarce Interstellar era, the Agricultural Deity Bai Li satisfies his farming urge by creating a virtual reality farming game. The game becomes a massive hit, drawing in Interstellar people and even a high-ranking Admiral.",
        source: "Exiled Rebels Scanlations"
    },
    doctor: {
        titleEnglish: "Full-Time Doctor (Guideverse)",
        titleOriginal: "全职医生",
        author: "Jueshi Mao Pi",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/754923783.jpg",
        genres: ["BL", "Guideverse", "Doctors", "Military", "School"],
        status: "Completed",
        synopsis: "Wu Chenghe, a military doctor from Earth, transmigrates into an Interstellar era as a 'guide'—a rare and forbidden role. As the illegitimate child of a supreme commander, he must navigate a dangerous world of sentinels and guides.",
        source: "Exiled Rebels Scanlations"
    },
    lessons: {
        titleEnglish: "Lessons on Raising a Partner",
        titleOriginal: "养成伴侣的技巧",
        author: "Ācí Gūniáng",
        coverImage: "https://i0.wp.com/exiledrebelsscanlations.com/wp-content/uploads/LRP-Cover.jpg",
        genres: ["Transmigration", "BL", "Fantasy", "Space", "Comedy", "Romance"],
        status: "Completed",
        synopsis: "When Hai'an opens his eyes after a transmigration, he finds himself in outer space—as a plant called trembling grass. He is subsequently 'raised' by a powerful figure, leading to a comedic and romantic journey as a sentient seedling.",
        source: "Exiled Rebels Scanlations"
    }
};

const basePath = './scraper-data/data/raw/novels/';

Object.entries(METADATA).forEach(([key, meta]) => {
    const filePath = basePath + key + '_raw.json';
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        data.metadata = meta;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ ${meta.titleEnglish} - metadata saved`);
    } catch (err) {
        console.log(`❌ ${key} - ${err.message}`);
    }
});

console.log('\n=== ALL METADATA SAVED ===');
