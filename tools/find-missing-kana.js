import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data/hololive-cards.json');

if (!fs.existsSync(DATA_FILE)) {
    console.error('Data file not found');
    process.exit(1);
}

const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// Regex to detect anything NOT Hiragana, Katakana, common punctuation (ー・), or spaces.
// This will flag Kanji, English, Numbers, and other Symbols.
const needsReadingRegex = /[^\u3040-\u309F\u30A0-\u30FFー・\s0-9!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/;

const missing = [];

cards.forEach(card => {
    const name = card.name;
    const hasKana = card.kana && card.kana.trim().length > 0;

    // If name contains Kanji/English but kana field is empty
    if (needsReadingRegex.test(name) && !hasKana) {
        missing.push({
            id: card.id,
            name: name,
            expansion: card.expansion
        });
    }
});

// Group by name to see unique missing items
const uniqueMissing = {};
missing.forEach(m => {
    if (!uniqueMissing[m.name]) {
        uniqueMissing[m.name] = { count: 0, exampleId: m.id };
    }
    uniqueMissing[m.name].count++;
});

console.log(`Total card entries needing reading but missing 'kana': ${missing.length}`);
console.log(`Unique names missing: ${Object.keys(uniqueMissing).length}\n`);

Object.entries(uniqueMissing)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([name, info]) => {
        console.log(`${name} (count: ${info.count}, example: ${info.exampleId})`);
    });
