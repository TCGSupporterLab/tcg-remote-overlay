import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data/hololive-cards.json');

function analyzeKeywords() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error('Data file not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const wordCounts = new Map();

    data.forEach(card => {
        // Collect text from searchable fields
        const textToAnalyze = [
            card.name,
            card.tags,
            card.expansion,
            card.cardType
        ].filter(Boolean).join(' ');

        // Split by symbols, spaces, and brackets to isolate potential keywords
        // This won't work perfectly for Japanese without a tokenizer, 
        // but it's a good first step for English/Tags/Expansions.
        const words = textToAnalyze.split(/[\s/#［］【】()（）「」『』!！?？:：&＆・,、。.]+/);

        const seenInThisCard = new Set();

        words.forEach(word => {
            const cleanWord = word.trim();
            // Ignore empty, single char (usually not a keyword), or pure numbers
            if (cleanWord.length > 1 && !/^\d+$/.test(cleanWord) && !seenInThisCard.has(cleanWord)) {
                wordCounts.set(cleanWord, (wordCounts.get(cleanWord) || 0) + 1);
                seenInThisCard.add(cleanWord);
            }
        });
    });

    // Filter words that appear in at least 2 cards
    const commonWords = Array.from(wordCounts.entries())
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1]); // Sort by frequency

    console.log('Total unique candidate keywords found:', wordCounts.size);
    console.log('Keywords appearing in 2+ cards:', commonWords.length);
    console.log('\nTop 100 most frequent keywords:');
    console.log(JSON.stringify(commonWords.slice(0, 100), null, 2));

    // Export all common words to a temporary analysis file
    const analysisResult = {
        timestamp: new Date().toISOString(),
        totalCards: data.length,
        keywords: commonWords.map(([word, count]) => ({ word, count }))
    };

    fs.writeFileSync(path.join(__dirname, 'keyword-analysis.json'), JSON.stringify(analysisResult, null, 2));
    console.log('\nFull analysis results saved to scripts/keyword-analysis.json');
}

analyzeKeywords();
