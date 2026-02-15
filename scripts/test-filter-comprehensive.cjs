const fs = require('fs');
const path = require('path');

// --- 1. Load Data ---
const cardDataPath = path.join(__dirname, '../src/data/hololive-cards.json');
const cards = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'));
console.log(`Loaded ${cards.length} cards.`);

// --- 2. Define Options (Mirroring FilterPanel.tsx) ---
const OPTIONS = {
    color: ['白', '緑', '赤', '青', '紫', '黄', 'colorless'], // Ignoring multi/not_multi for basic checks
    cardType: ['ホロメン', 'Buzzホロメン', '推しホロメン', 'サポート', 'LIMITED'],
    bloomLevel: ['Debut', '1st', '2nd', 'Spot']
};

// --- 3. The Logic Under Test (Copied from useCardSearch.ts) ---
// *Update this if useCardSearch.ts changes*
const checkCategory = (category, cardValueRaw, selectedFilters) => {
    const cardValue = cardValueRaw || ''; // Handle undefined safety

    // In the real hook, these checks happen before calling checkCategory, 
    // or inside the hook. The hook logic is:
    // const selected = filters[category];
    // if (selected.includes('all')) return true;
    // if (selected.length === 0) return true;

    // We simulate `selectedFilters` being the specific array passed in.
    if (selectedFilters.includes('all')) return true;
    if (selectedFilters.length === 0) return true;

    if (category === 'color') {
        const validSelections = selectedFilters.filter(s => s !== 'multi' && s !== 'not_multi' && s !== 'all');
        if (validSelections.length > 0) {
            return validSelections.some(s => {
                if (s === 'colorless') {
                    return cardValue.includes('無') || cardValue.includes('◇');
                }
                // Exact match only for colors
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

// --- 4. Validation Helper ---
// Returns TRUE if the card IS valid for the given single filter option.
// This is the "Ground Truth" check.
const isCardValidForOption = (category, option, card) => {
    const val = card[category] || '';

    if (category === 'color') {
        if (option === 'colorless') return val.includes('無') || val.includes('◇');
        return val.includes(option);
    }
    if (category === 'cardType') {
        if (option === 'ホロメン') return val.includes('ホロメン') && !val.includes('推し');
        return val.includes(option);
    }
    if (category === 'bloomLevel') {
        return val.includes(option); // Assuming simplistic include is correct for Bloom
    }
    return val.includes(option);
};


// --- 5. Test Functions ---

function testSingleOptions() {
    console.log('\n=== TESTING SINGLE OPTIONS ===');
    let totalErrors = 0;

    for (const [category, options] of Object.entries(OPTIONS)) {
        for (const option of options) {
            const filters = [option];
            // Run the filter logic
            const results = cards.filter(c => checkCategory(category, c[category], filters));

            // Verify results
            let errors = 0;
            results.forEach(c => {
                // For a single option filter, the card MUST match that option.
                if (!isCardValidForOption(category, option, c)) {
                    errors++;
                    if (errors <= 5) { // Show first few errors
                        console.error(`[ERROR] Filter '${option}' (Category: ${category}) matched invalid card: ${c.name} (${category}: ${c[category]})`);
                    }
                }
            });

            if (results.length === 0) {
                console.warn(`[WARN] Filter '${option}' returned 0 results.`);
            }

            if (errors > 0) {
                console.error(`❌ ${category} - ${option}: FAILED with ${errors} false positives (out of ${results.length} results)`);
                totalErrors += errors;
            } else {
                console.log(`✅ ${category} - ${option}: OK (${results.length} matches)`);
            }
        }
    }
    return totalErrors;
}

function testRandomCombinations(iterations = 5) {
    console.log(`\n=== TESTING RANDOM COMBINATIONS (${iterations} runs) ===`);
    let totalErrors = 0;

    for (let i = 0; i < iterations; i++) {
        // Pick a random category
        const categories = Object.keys(OPTIONS);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const possibleOptions = OPTIONS[category];

        // Pick 2-3 random options
        const count = 2 + Math.floor(Math.random() * 2);
        const selected = [];
        while (selected.length < count && selected.length < possibleOptions.length) {
            const opt = possibleOptions[Math.floor(Math.random() * possibleOptions.length)];
            if (!selected.includes(opt)) selected.push(opt);
        }

        console.log(`Testing Combination: [${category}] = ${selected.join(', ')}`);

        const results = cards.filter(c => checkCategory(category, c[category], selected));

        // Verify: Card must match AT LEAST ONE of the selected options
        let errors = 0;
        results.forEach(c => {
            const isValid = selected.some(opt => isCardValidForOption(category, opt, c));
            if (!isValid) {
                errors++;
                if (errors <= 3) {
                    console.error(`[ERROR] Multi-filter matched invalid card: ${c.name} (${category}: ${c[category]})`);
                }
            }
        });

        if (errors > 0) {
            console.error(`❌ Combination FAILED with ${errors} false positives.`);
            totalErrors += errors;
        } else {
            console.log(`✅ Combination OK (${results.length} matches)`);
        }
    }
    return totalErrors;
}

// --- 6. Execution ---
// const singleErrors = testSingleOptions();
// const comboErrors = testRandomCombinations(10);

const targetNames = ['アキ・ローゼンタール', 'パヴォリア・レイネ', '天音かなた'];
console.log('\n--- Checking Target Cards for Color Variations ---');
targetNames.forEach(name => {
    const matches = cards.filter(c => c.name === name);
    console.log(`\nName: ${name} (Count: ${matches.length})`);
    matches.forEach(c => console.log(` - ID: ${c.id}, Color: ${c.color}, Type: ${c.cardType}`));
});
