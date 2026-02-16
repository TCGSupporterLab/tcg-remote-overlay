import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data/hololive-cards.json');
const IMAGE_DIR = path.join(__dirname, '../public/images/cards');
const PUBLIC_PATH_PREFIX = '/images/cards/';

const TARGET_WIDTH = 400;
const TARGET_HEIGHT = 559;

// Helper to download image
const downloadImage = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            } else {
                res.consume();
                reject(new Error(`Status Code: ${res.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
};

const processImage = async (input, outputPath) => {
    try {
        const image = sharp(input);
        const metadata = await image.metadata();

        if (metadata.width !== TARGET_WIDTH || metadata.height !== TARGET_HEIGHT) {
            await image
                .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                    fit: 'fill'
                })
                .toFile(outputPath);
            return true; // Resized
        } else if (input instanceof Buffer || !fs.existsSync(outputPath)) {
            await image.toFile(outputPath);
            return true;
        }
    } catch (e) {
        throw new Error(`Sharp Error: ${e.message}`);
    }
    return false;
};

(async () => {
    console.log('🚀 Starting Image Downloader & Resizer (Target: 400x559)...');

    if (!fs.existsSync(DATA_FILE)) {
        console.error(`❌ Data file not found: ${DATA_FILE}`);
        process.exit(1);
    }

    if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    let cards = JSON.parse(rawData);

    console.log(`📊 Processing ${cards.length} cards...`);

    let downloadedCount = 0;
    let resizedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const remoteUrl = (card.originalImageUrl && card.originalImageUrl.startsWith('http'))
            ? card.originalImageUrl
            : card.imageUrl;

        if (!remoteUrl || !remoteUrl.startsWith('http')) {
            skippedCount++;
            continue;
        }

        let filename;
        try {
            const urlObj = new URL(remoteUrl);
            filename = path.basename(urlObj.pathname);
            if (!filename || !filename.includes('.')) filename = `${card.id}.png`;
        } catch (e) {
            filename = `${card.id}.png`;
        }

        const localFilepath = path.join(IMAGE_DIR, filename);
        const publicPath = `${PUBLIC_PATH_PREFIX}${filename}`;

        try {
            if (fs.existsSync(localFilepath)) {
                const wasResized = await processImage(localFilepath, localFilepath + '.tmp');
                if (wasResized) {
                    fs.renameSync(localFilepath + '.tmp', localFilepath);
                    process.stdout.write(`📐 Resized: ${card.name} [${filename}]\n`);
                    resizedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                process.stdout.write(`⬇️  Downloading: ${card.name} [${filename}]... `);
                const buffer = await downloadImage(remoteUrl);
                await processImage(buffer, localFilepath);
                console.log('✅ OK & Resized');
                downloadedCount++;
                await new Promise(r => setTimeout(r, 50));
            }
        } catch (e) {
            console.log(`❌ Error: ${e.message}`);
            if (fs.existsSync(localFilepath + '.tmp')) fs.unlinkSync(localFilepath + '.tmp');
            errorCount++;
            continue;
        }

        if (!card.originalImageUrl) card.originalImageUrl = remoteUrl;
        card.imageUrl = publicPath;
    }

    console.log(`\n✨ Summary:`);
    console.log(`   Downloaded: ${downloadedCount}`);
    console.log(`   Resized:    ${resizedCount}`);
    console.log(`   Skipped:    ${skippedCount}`);
    console.log(`   Errors:     ${errorCount}`);

    if (errorCount > 20) {
        console.error('\n❌ Too many errors. Aborting JSON update.');
        process.exit(1);
    }

    console.log('\n💾 Saving updated JSON...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2));

    // Final Task: Remove unused images
    console.log('🧹 Cleaning up unused images...');
    try {
        const usedFilenames = new Set(cards.map(c => path.basename(c.imageUrl)));
        const allFiles = fs.readdirSync(IMAGE_DIR);
        let deletedCount = 0;

        allFiles.forEach(file => {
            if (file.endsWith('.png') && !usedFilenames.has(file)) {
                fs.unlinkSync(path.join(IMAGE_DIR, file));
                deletedCount++;
            }
        });
        if (deletedCount > 0) {
            console.log(`   Deleted ${deletedCount} unused files.`);
        } else {
            console.log('   No unused files found.');
        }
    } catch (e) {
        console.log(`   Warning: Cleanup failed - ${e.message}`);
    }

    console.log('🎉 Done!');
})();
