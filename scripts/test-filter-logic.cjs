const fs = require('fs');
const path = require('path');

// Load Card Data
const cardDataPath = path.join(__dirname, '../src/data/hololive-cards.json');
const cards = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'));

console.log(`Loaded ${cards.length} cards.`);

// Mock Filter Function (copied from useCardSearch.ts logic)
const checkCategory = (category, cardValueRaw, selectedFilters) => {
    const cardValue = cardValueRaw || '';
    if (selectedFilters.includes('all')) return true;
    if (selectedFilters.length === 0) return true;

    if (category === 'color') {
        const validSelections = selectedFilters.filter(s => s !== 'multi' && s !== 'not_multi' && s !== 'all');
        if (validSelections.length > 0) {
            return validSelections.some(s => {
                if (s === 'colorless') {
                    return cardValue.includes('無') || cardValue.includes('◇');
                }
                return cardValue.includes(s);
            });
        }
        return true;
    }

    if (category === 'cardType') {
        return selectedFilters.some(s => {
            if (s === 'ホロメン') {
                // "Holomen" should NOT include "Oshi Holomen"
                return cardValue.includes('ホロメン') && !cardValue.includes('推し');
            }
            return cardValue.includes(s);
        });
    }

    // Standard OR match
    return selectedFilters.some(s => cardValue.includes(s));
};

// Analysis Functions
function analyzeField(field) {
    console.log(`\n--- Analyzing Field: ${field} ---`);
    const values = {};
    cards.forEach(c => {
        const val = c[field] || "(undefined)";
        values[val] = (values[val] || 0) + 1;
    });
    console.log("Unique Values found in data:", values);
}

// Test Specific Scenarios
function testColorFilter(colorName, filterKey) {
    console.log(`\nTesting Color Filter: ${colorName} (${filterKey})`);
    const results = cards.filter(c => checkCategory('color', c.color, [filterKey]));
    console.log(`Found ${results.length} cards.`);
    if (results.length > 0) {
        console.log(`Sample: ${results[0].name} (Color: ${results[0].color})`);
    } else {
        console.log("NO MATCHES FOUND!");
    }
}

function testTypeFilter(typeName, filterKey) {
    console.log(`\nTesting Type Filter: ${typeName} (${filterKey})`);
    const results = cards.filter(c => checkCategory('cardType', c.cardType, [filterKey]));
    console.log(`Found ${results.length} cards.`);
    if (results.length > 0) {
        console.log(`Sample: ${results[0].name} (Type: ${results[0].cardType})`);
    }
}

function testBloomFilter(levelName, filterKey) {
    console.log(`\nTesting Bloom Filter: ${levelName} (${filterKey})`);
    const results = cards.filter(c => checkCategory('bloomLevel', c.bloomLevel, [filterKey]));
    console.log(`Found ${results.length} cards.`);
    if (results.length > 0) {
        console.log(`Sample: ${results[0].name} (Bloom: ${results[0].bloomLevel})`);
    }
}


// RUN ANALYSIS
analyzeField('color');
analyzeField('cardType');
analyzeField('bloomLevel');

// RUN TESTS
// Colors
testColorFilter("White", "白"); // Add explicit White test
testColorFilter("Colorless", "colorless");
testColorFilter("Red", "赤");
testColorFilter("Blue", "青");
testColorFilter("Green", "緑");
testColorFilter("Yellow", "黄");
testColorFilter("Purple", "紫");

// Types
testTypeFilter("Oshi", "推しホロメン");
testTypeFilter("Holomen", "ホロメン");
testTypeFilter("Support", "サポート");
testTypeFilter("Yell", "エール");

// Bloom
testBloomFilter("Debut", "Debut"); // Fix: Use English value as passed by FilterPanel
testBloomFilter("1st", "1st");
testBloomFilter("2nd", "2nd");
testBloomFilter("Spot", "Spot");
