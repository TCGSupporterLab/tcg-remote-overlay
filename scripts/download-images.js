import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data/hololive-cards.json');
const IMAGE_DIR = path.join(__dirname, '../public/images/cards');
const PUBLIC_PATH_PREFIX = '/images/cards/';

// Helper to download image
const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                const stream = fs.createWriteStream(filepath);
                res.pipe(stream);
                stream.on('finish', () => {
                    stream.close();
                    resolve(true);
                });
            } else {
                res.consume(); // Consume response data to free up memory
                reject(new Error(`Status Code: ${res.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
};

(async () => {
    console.log('🚀 Starting Image Downloader...');

    if (!fs.existsSync(DATA_FILE)) {
        console.error(`❌ Data file not found: ${DATA_FILE}`);
        process.exit(1);
    }

    // Ensure image directory exists
    if (!fs.existsSync(IMAGE_DIR)) {
        console.log(`P Creating directory: ${IMAGE_DIR}`);
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    let cards = JSON.parse(rawData);

    console.log(`📊 Processing ${cards.length} cards...`);

    let downloadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process sequentially to be polite to the server
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const imageId = card.id; // Use ID as filename
        const filename = `${imageId}.png`; // Assuming PNG, but URL might be different. Let's force PNG based on user request/observation or extract ext.
        // The scraping script observed URLs ending in .png, so .png is safe.

        const localFilepath = path.join(IMAGE_DIR, filename);
        const publicPath = `${PUBLIC_PATH_PREFIX}${filename}`;

        // Check if already downloaded
        if (fs.existsSync(localFilepath)) {
            // console.log(`⏭️  Skipping (exists): ${card.name}`);
            skippedCount++;
        } else {
            const remoteUrl = card.imageUrl;
            if (remoteUrl && remoteUrl.startsWith('http')) {
                process.stdout.write(`⬇️  Downloading (${i + 1}/${cards.length}): ${card.name}... `);
                try {
                    await downloadImage(remoteUrl, localFilepath);
                    console.log('✅ OK');
                    downloadedCount++;
                    // Basic rate limiting
                    await new Promise(r => setTimeout(r, 100));
                } catch (e) {
                    console.log(`❌ Failed: ${e.message}`);
                    errorCount++;
                    // Don't update the URL if download failed, keep remote URL
                    continue;
                }
            } else {
                // No valid remote URL or already local?
                // console.log(`❓ No remote URL: ${card.name}`);
            }
        }

        // Update card data to use local path
        // We preserve the original URL in a new field if strictly needed, but for now just update imageUrl
        // Actually, let's store 'originalImageUrl' just in case we need to re-download later.
        if (!card.originalImageUrl) {
            card.originalImageUrl = card.imageUrl;
        }
        card.imageUrl = publicPath;
    }

    console.log(`   Downloaded: ${downloadedCount}`);
    console.log(`   Skipped:    ${skippedCount}`);
    console.log(`   Errors:     ${errorCount}`);

    if (errorCount > 10) {
        console.error('\n❌ Too many download errors. Aborting JSON update to keep data consistent.');
        process.exit(1);
    }

    console.log('\n💾 Saving updated JSON...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2));

    console.log('🎉 Done!');
})();
