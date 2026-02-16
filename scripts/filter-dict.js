import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DICT_FILE = path.join(__dirname, '../src/data/kana-dictionary.json');

if (!fs.existsSync(DICT_FILE)) {
    console.error('Dictionary file not found');
    process.exit(1);
}

const dict = JSON.parse(fs.readFileSync(DICT_FILE, 'utf-8'));

// Regex to check if a string consists ONLY of Hiragana, Katakana, Punctuation marks used in them, and spaces.
// We want to KEEP keys that have Kanji, English, Numbers, or other symbols.
const isKanaOnly = (str) => /^[\u3040-\u309F\u30A0-\u30FFー・\s]+$/.test(str);

const filteredDict = {};
let removedCount = 0;

Object.keys(dict).forEach(key => {
    if (!isKanaOnly(key)) {
        filteredDict[key] = dict[key];
    } else {
        removedCount++;
        console.log(`Removing: ${key}`);
    }
});

fs.writeFileSync(DICT_FILE, JSON.stringify(filteredDict, null, 2));
console.log(`\nFiltered dictionary updated.`);
console.log(`Removed ${removedCount} entries that were Hiragana/Katakana only.`);
console.log(`Remaining entries: ${Object.keys(filteredDict).length}`);
