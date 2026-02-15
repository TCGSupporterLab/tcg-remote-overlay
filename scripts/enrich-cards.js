import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data/hololive-cards.json');
const KANA_DICT_FILE = path.join(__dirname, '../src/data/kana-dictionary.json');

if (!fs.existsSync(DATA_FILE) || !fs.existsSync(KANA_DICT_FILE)) {
    console.error('File not found');
    process.exit(1);
}

const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const kanaDict = JSON.parse(fs.readFileSync(KANA_DICT_FILE, 'utf-8'));

function generateKana(card) {
    const textToAnalyze = [
        card.name,
        card.tags
    ].filter(Boolean).join(' ');

    let kanaResult = new Set();
    const sortedKeys = Object.keys(kanaDict).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
        if (textToAnalyze.includes(key)) {
            kanaResult.add(kanaDict[key]);
        }
    }

    return Array.from(kanaResult).join(' ');
}

console.log('📖 Enriching existing cards with kana readings...');
const enriched = cards.map(c => ({
    ...c,
    kana: generateKana(c)
}));

fs.writeFileSync(DATA_FILE, JSON.stringify(enriched, null, 2));
console.log('✅ Done!');
