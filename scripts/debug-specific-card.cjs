const fs = require('fs');
const path = require('path');

const cardDataPath = path.join(__dirname, '../src/data/hololive-cards.json');
const cards = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'));

// 1. Find hBP01-003
const targetId = 'hBP01-003';
const targetCard = cards.find(c => c.id === targetId);
console.log(`\n--- Looking for ${targetId} ---`);
if (targetCard) {
    console.log(`Found: ${targetCard.name}`);
    console.log(`Color: ${targetCard.color}`);
    console.log(`Type: ${targetCard.cardType}`);
} else {
    console.log("NOT FOUND. Searching for partial '003'...");
    const partial = cards.filter(c => c.id.includes('BP01-003'));
    partial.forEach(c => console.log(`Potential Match: ${c.id} - ${c.name} (${c.color})`));
}

// 2. Simulate "White" Filter and Sort
console.log('\n--- Simulating White Filter (Sort by ID) ---');
const whiteCards = cards.filter(c => c.color.includes('白'))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

console.log(`Total White Cards: ${whiteCards.length}`);
if (whiteCards.length >= 17) {
    const c17 = whiteCards[16]; // Index 16 is 17th
    console.log(`17th Card: ${c17.id} - ${c17.name}`);
    console.log(`Color: ${c17.color}`);
} else {
    console.log("Less than 17 cards found.");
}

// 3. Check if targetCard is in the whitelist (if found)
if (targetCard) {
    const inList = whiteCards.find(c => c.id === targetId);
    console.log(`\nIs ${targetId} in the White list? ${inList ? 'YES' : 'NO'}`);
}
