// Select 20 short novels (<150 chapters)
const novels = require('./new-novels-to-scrape.json');
const fs = require('fs');

const short = novels.filter(n => n.chaptersCount <= 150).slice(0, 20);

console.log('=== 20 Novel Pendek (<150 chapter) untuk Scrape ===\n');
short.forEach((n, i) => {
    console.log(`${i + 1}. ${n.title} (${n.chaptersCount} ch)`);
    console.log(`   Genres: ${n.genres.join(', ')}`);
    console.log(`   URL: ${n.novelUrl}`);
    console.log('');
});

fs.writeFileSync('selected-novels.json', JSON.stringify(short, null, 2));
console.log(`✅ Saved ${short.length} novels to selected-novels.json`);
