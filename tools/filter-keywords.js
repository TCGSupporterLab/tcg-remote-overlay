import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANALYSIS_FILE = path.join(__dirname, 'keyword-analysis.json');

function filterKeywords() {
    if (!fs.existsSync(ANALYSIS_FILE)) {
        console.error('Analysis file not found');
        return;
    }

    const { keywords } = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf-8'));

    // Character ranges
    // Hiragana: \u3040-\u309F
    // Katakana: \u30A0-\u30FF
    // Symbols/Numbers: \u0021-\u003F, \uFF01-\uFF0F etc.
    // Basically, we want to KEEP anything that has:
    // 1. Kanji (CJK Unified Ideographs: \u4E00-\u9FFF)
    // 2. English (A-Z, a-z)
    // 3. Any other non-kana characters that might be part of a name (like Greek or special symbols not in our exclusion list)

    const isKanaOnly = (str) => {
        // This regex matches strings that ONLY contain Hiragana, Katakana, Prolonged sound mark (ー), Middle dot (・), and common symbols we normalize.
        // If it returns true, we EXCLUDE it.
        return /^[\u3040-\u309F\u30A0-\u30FFー・\s0-9]+$/.test(str);
    };

    const needsReading = keywords.filter(k => {
        // Keep if it's NOT kana-only (meaning it has Kanji, English, or other stuff)
        return !isKanaOnly(k.word);
    });

    console.log('Original keywords:', keywords.length);
    console.log('Keywords needing reading (Kanji/English):', needsReading.length);

    // Save to a new file for review
    const result = {
        timestamp: new Date().toISOString(),
        keywords: needsReading
    };

    fs.writeFileSync(path.join(__dirname, 'needs-reading.json'), JSON.stringify(result, null, 2));
    console.log('\nFiltered results saved to scripts/needs-reading.json');
}

filterKeywords();
