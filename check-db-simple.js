// Simple check via API endpoint
async function checkDatabase() {
    try {
        console.log('🔍 Checking database via API...\n');

        // Check novels
        const novelsResponse = await fetch('http://localhost:3000/api/novels');
        if (!novelsResponse.ok) {
            console.log('⚠️  Server not running. Start with: npm run dev');
            return;
        }

        const novels = await novelsResponse.json();
        console.log(`📚 Total novels: ${novels.length}\n`);

        for (const novel of novels) {
            console.log(`📖 ${novel.title}`);
            console.log(`   - Total chapters: ${novel.totalChapters || 0}`);
            console.log(`   - Source: ${novel.source || 'Unknown'}`);
        }

        console.log('\n💡 To check untranslated chapters, run server first: npm run dev');

    } catch (error) {
        console.log('⚠️  Server not running. Please start with: npm run dev');
        console.log('   Then I can check the database for untranslated content.');
    }
}

checkDatabase();
