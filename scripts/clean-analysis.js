import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANALYSIS_FILE = path.join(__dirname, 'keyword-analysis.json');

function cleanAnalysisFile() {
    if (!fs.existsSync(ANALYSIS_FILE)) {
        console.error('Analysis file not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf-8'));

    // Regex for strings that only contain Hiragana, Katakana, Punctuation marks (ー, ・), and spaces.
    const isKanaOnly = (str) => /^[\u3040-\u309F\u30A0-\u30FFー・\s]+$/.test(str);

    const filteredKeywords = data.keywords.filter(k => {
        // We want to KEEP words that have Kanji, English, or Numbers (since they usually signify generations or specific counts)
        // Basically, if it's NOT just Kana, we keep it.
        return !isKanaOnly(k.word);
    });

    data.keywords = filteredKeywords;
    data.filteredCount = filteredKeywords.length;

    fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(data, null, 2));
    console.log(`Updated keyword-analysis.json. Kept ${filteredKeywords.length} keywords.`);
}

cleanAnalysisFile();
