import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHED_PAGE_DIR = path.join(__dirname, 'cache/hololive');

const testCardIds = [
    'hSD13-001', // Oshi Holomen
    'hSD13-003', // Debut Holomen, Has Extra
    'hSD13-008', // Debut Holomen, Has Collab Effect
    'hSD13-006', // 1st Holomen, Has Bloom Effect
    'hSD13-007', // 2nd Holomen, Has Gift
    'hSD12-006', // Buzz Holomen, Has Bloom & Extra (Penalty)
    'hSD13-016', // Support (Event), Has LIMITED
    'hSD12-015', // Support (Event), No LIMITED
    'hBP06-085'  // Support (Item), Has LIMITED
];

async function testScraping() {
    console.log('🧪 Starting Scraping Test using local cache...');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const allResults = [];

    // Combine page_1, page_2, page_3 content
    const pagesToLoad = ['page_1.html', 'page_2.html', 'page_3.html'];

    for (const fileName of pagesToLoad) {
        const filePath = path.join(CACHED_PAGE_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Cache file not found: ${filePath}`);
            continue;
        }

        console.log(`📖 Loading ${fileName}...`);
        const html = fs.readFileSync(filePath, 'utf-8');
        await page.setContent(html);

        const pageResults = await page.evaluate((targetIds) => {
            const results = [];
            const listItems = document.querySelectorAll('li');

            const cleanText = (text) => {
                if (!text) return '';
                return text.replace(/\n\s*\n/g, '\n').trim();
            };

            listItems.forEach(li => {
                const numberEl = li.querySelector('.number');
                if (!numberEl) return;

                const id = numberEl.innerText.trim();
                if (!targetIds.includes(id)) return;

                const name = li.querySelector('.name')?.innerText.trim() || '';
                const cardType = Array.from(li.querySelectorAll('dt'))
                    .find(dt => dt.innerText.includes('カードタイプ'))
                    ?.nextElementSibling?.innerText.trim() || '';

                const details = {
                    id,
                    name,
                    cardType,
                    oshiSkills: [],
                    arts: [],
                    keywords: [],
                    abilityText: '',
                    extra: '',
                    limited: false
                };

                // 1. Oshi Skills
                li.querySelectorAll('.skill').forEach(skillEl => {
                    const label = skillEl.querySelector('p:first-child')?.innerText.trim() || '';
                    const contentPara = skillEl.querySelector('p:nth-child(2)');
                    if (!contentPara) return;

                    const fullText = contentPara.innerText.trim();
                    const name = contentPara.querySelector('span')?.innerText.trim() || '';

                    // Extract cost from [ホロパワー：-3]
                    const costMatch = fullText.match(/\[ホロパワー：([^\]]+)\]/);
                    const cost = costMatch ? costMatch[1] : '';

                    // Get text after name or span
                    let text = fullText;
                    if (name) {
                        const parts = fullText.split(name);
                        text = parts.length > 1 ? parts[1].trim() : fullText;
                    }
                    // Remove cost from text if present
                    if (cost) {
                        text = text.replace(`[ホロパワー：${cost}]`, '').trim();
                    }

                    details.oshiSkills.push({ label, name, cost, text: cleanText(text) });
                });

                // 2. Arts
                li.querySelectorAll('.arts').forEach(artsEl => {
                    const contentPara = artsEl.querySelector('p:nth-child(2)');
                    if (!contentPara) return;

                    const span = contentPara.querySelector('span');
                    if (!span) return;

                    const costs = Array.from(span.querySelectorAll('img:not(.tokkou img)'))
                        .filter(img => !img.closest('.tokkou'))
                        .map(img => img.alt.trim());

                    const tokkouEl = span.querySelector('.tokkou');
                    let tokkou = '';
                    if (tokkouEl) {
                        const tokkouIcon = tokkouEl.querySelector('img')?.alt.trim() || '';
                        const tokkouText = tokkouEl.innerText.trim();
                        tokkou = tokkouIcon || tokkouText;
                    }

                    const fullSpanText = span.innerText.trim();
                    const damageMatch = fullSpanText.match(/(\d+[\+＋]?)$/);
                    const damage = damageMatch ? damageMatch[1] : '';

                    let artName = fullSpanText;
                    if (damage) {
                        artName = artName.replace(damage, '').trim();
                    }
                    if (tokkouEl) {
                        artName = artName.replace(tokkouEl.innerText.trim(), '').trim();
                    }

                    const effectText = contentPara.innerText.replace(fullSpanText, '').trim();

                    details.arts.push({
                        name: artName,
                        costs,
                        damage,
                        tokkou,
                        text: cleanText(effectText)
                    });
                });

                // 3. Keywords (Gift, Bloom Effect, etc.)
                li.querySelectorAll('.keyword').forEach(kwEl => {
                    const contentPara = kwEl.querySelector('p:nth-child(2)');
                    if (!contentPara) return;

                    const span = contentPara.querySelector('span');
                    const typeIcon = span?.querySelector('img')?.alt.trim() || '';
                    const kwName = span?.innerText.trim() || '';
                    const text = contentPara.innerText.replace(kwName, '').trim();

                    details.keywords.push({
                        type: typeIcon,
                        name: kwName,
                        text: cleanText(text)
                    });
                });

                // 4. Ability Text (Support)
                const abilityDt = Array.from(li.querySelectorAll('dt'))
                    .find(dt => dt.innerText.includes('能力テキスト'));
                if (abilityDt && abilityDt.nextElementSibling) {
                    let text = abilityDt.nextElementSibling.innerText.trim();

                    // Check for LIMITED and remove the text
                    const limitedStr = 'LIMITED：ターンに1枚しか使えない。';
                    if (text.includes(limitedStr) || details.cardType.includes('LIMITED')) {
                        details.limited = true;
                        text = text.replace(limitedStr, '').trim();
                    }
                    details.abilityText = cleanText(text);
                }

                // 5. Extra
                const extraEls = li.querySelectorAll('.extra p:nth-child(2)');
                if (extraEls.length > 0) {
                    details.extra = cleanText(Array.from(extraEls).map(el => el.innerText.trim()).join('\n'));
                }

                results.push(details);
            });

            return results;
        }, testCardIds);

        allResults.push(...pageResults);
    }

    console.log('📊 Test Results:');
    console.log(JSON.stringify(allResults, null, 2));

    await browser.close();
}

testScraping().catch(console.error);
