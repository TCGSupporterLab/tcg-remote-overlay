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

// Strict check: Is there ANY character that isn't Hiragana, Katakana, basic punctuation, or numbers?
// Allowed: 
// \u3040-\u309F (Hiragana)
// \u30A0-\u30FF (Katakana)
// \uFF00-\uFFEF (Half/Full width forms, excluding Kanji - mostly punctuation/numbers/roma-ji)
// 0-9 (Numbers)
// \s (Space)
// ー ・ ！ ？ （ ） 、 。
const kanaOnlyRegex = /^[\u3040-\u309F\u30A0-\u30FFー・\s0-9！?（?、。、「」]+$/;

const missing = [];

cards.forEach(card => {
    const name = card.name;
    const hasKana = card.kana && card.kana.trim().length > 0;

    // If the name is NOT already just Hiragana/Katakana/etc.
    // AND it doesn't have a 'kana' reading
    if (!kanaOnlyRegex.test(name) && !hasKana) {
        missing.push({
            id: card.id,
            name: name,
            expansion: card.expansion
        });
    }
});

const uniqueMissing = {};
missing.forEach(m => {
    if (!uniqueMissing[m.name]) {
        uniqueMissing[m.name] = { count: 0, exampleId: m.id };
    }
    uniqueMissing[m.name].count++;
});

console.log(`Results of audit:`);
console.log(`Total card entries needing reading but missing 'kana': ${missing.length}`);
console.log(`Unique names missing: ${Object.keys(uniqueMissing).length}\n`);

if (missing.length > 0) {
    Object.entries(uniqueMissing)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([name, info]) => {
            console.log(`${name} (count: ${info.count}, example: ${info.exampleId})`);
        });
} else {
    console.log("No missing kana fields found for names containing non-kana characters.");
}
