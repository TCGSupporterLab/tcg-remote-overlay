import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data/hololive-cards.json');
const ICON_DIR = path.join(__dirname, '../public/images/icons');

const COLOR_MAP = {
    '赤': 'red',
    '青': 'blue',
    '緑': 'green',
    '白': 'white',
    '黄': 'yellow',
    '紫': 'purple',
    '◇': 'null'
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: { 'User-Agent': USER_AGENT }
        };

        https.get(url, options, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                file.close();
                fs.unlinkSync(dest);
                reject(new Error(`Status: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            reject(err);
        });
    });
};

(async () => {
    console.log('🚀 Checking for new type icons...');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ Data file not found.');
        process.exit(1);
    }

    if (!fs.existsSync(ICON_DIR)) {
        fs.mkdirSync(ICON_DIR, { recursive: true });
    }

    const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const uniqueCombos = new Set();

    cards.forEach(card => {
        // 多色カード（2色以上、◇を含まない）を探す
        if (card.color.length >= 2 && !card.color.includes('◇')) {
            uniqueCombos.add(card.color);
        }
    });

    console.log(`📊 Found ${uniqueCombos.size} multi-color combinations in data.`);

    let downloadCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const combo of uniqueCombos) {
        // "白緑" -> ["white", "green"]
        const colors = Array.from(combo).map(c => COLOR_MAP[c]).filter(Boolean);
        if (colors.length < 2) continue;

        const iconName = `type_${colors.join('_')}.png`;
        const localPath = path.join(ICON_DIR, iconName);
        const url = `https://hololive-official-cardgame.com/wp-content/images/texticon/${iconName}`;

        if (fs.existsSync(localPath)) {
            skipCount++;
            continue;
        }

        try {
            console.log(`⬇️  Downloading new icon: ${iconName} ...`);
            await downloadFile(url, localPath);
            console.log('   ✅ Success');
            downloadCount++;
            // Server polite
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            // 色の順番を入れ替えて再試行（例：red_blue -> blue_red）
            if (colors.length === 2) {
                const swappedName = `type_${colors[1]}_${colors[0]}.png`;
                const swappedUrl = `https://hololive-official-cardgame.com/wp-content/images/texticon/${swappedName}`;
                console.log(`   🔄 Retrying with swapped order: ${swappedName} ...`);
                try {
                    await downloadFile(swappedUrl, localPath);
                    console.log('   ✅ Success (Swapped Order)');
                    downloadCount++;
                    await new Promise(r => setTimeout(r, 200));
                    continue;
                } catch (swapError) {
                    // Both failed
                }
            }
            console.warn(`   ⚠️  Failed to download ${iconName}: ${e.message}`);
            errorCount++;
        }
    }

    console.log('\n✨ Icon Check Summary:');
    console.log(`   New Downloaded: ${downloadCount}`);
    console.log(`   Already Exists: ${skipCount}`);
    console.log(`   Failed:         ${errorCount}`);
    console.log('🎉 Done!');
})();
