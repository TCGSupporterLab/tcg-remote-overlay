import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data/hololive-cards.json');

const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

const overseasSearch = [
    // EN
    "Myth", "Promise", "Advent", "Justice", "Council",
    "Calliope", "Kiara", "Ina'nis", "Gura", "Amelia",
    "IRyS", "Fauna", "Kronii", "Mumei", "Baelz",
    "Shiori", "Bijou", "Nerissa", "Fuwawa", "Mococo",
    "Elizabeth", "Gigi", "Cecilia", "Raora",
    "Death-sensei", "Kotori", "Takodachi", "Bloop", "Bubba",
    "RyStocrats", "Saplings", "Kronies", "Hoomans", "Brats",
    "Novelites", "Pebbles", "Jailbirds", "Ruffians",
    // ID
    "Risu", "Moona", "Iofifteen", "Ollie", "Anya", "Reine", "Zeta", "Kaela", "Kobo",
    "Risuners", "Moonafic", "Ioforia", "Zomrade", "Melfriends", "Merakyat", "Zecretary"
];

const results = {};
overseasSearch.forEach(term => results[term] = 0);

cards.forEach(card => {
    const text = [card.name, card.tags, card.expansion].join(' ').toLowerCase();
    overseasSearch.forEach(term => {
        if (text.includes(term.toLowerCase())) {
            results[term]++;
        }
    });
});

const found = Object.entries(results).filter(([term, count]) => count > 0).sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify(found, null, 2));
