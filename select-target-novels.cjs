const fs = require('fs');
const path = require('path');

// Load trending completed free novels
const trendingNovels = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'trending-completed-free.json'), 'utf8')
);

// Filter novels with <= 200 chapters
const shortNovels = trendingNovels.filter(n => n.chaptersCount <= 200);

console.log(`Total Trending Novels: ${trendingNovels.length}`);
console.log(`Novels <= 200 Chapters: ${shortNovels.length}\n`);

// Select top 30
const selected = shortNovels.slice(0, 30);

console.log('=== Top 30 Selected Novels ===');
selected.forEach((n, i) => {
    console.log(`${i + 1}. ${n.title} (${n.chaptersCount} ch)`);
});

// Save to target file
fs.writeFileSync(
    path.join(__dirname, 'target-novels.json'),
    JSON.stringify(selected, null, 2)
);

console.log(`\n✅ Saved 30 target novels to target-novels.json`);
