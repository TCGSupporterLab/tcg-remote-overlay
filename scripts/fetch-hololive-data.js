import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = 'https://hololive-official-cardgame.com/cardlist/cardsearch/?keyword=&attribute%5B%5D=all&expansion_name=&card_kind%5B%5D=all&rare%5B%5D=all&bloom_level%5B%5D=all&parallel%5B%5D=all&view=text'; // Switched to text view
const OUTPUT_FILE = path.join(__dirname, '../src/data/hololive-cards.json');
const EXPECTED_COUNT_MIN = 1700; // Expected ~1725

(async () => {
    console.log('🚀 Starting Hololive Card Data Fetcher (Text Mode)...');
    console.log(`📡 Connecting to: ${TARGET_URL}`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 800 });

    try {
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('📜 Scrolling to load all cards...');

        // Helper function to parsing visible cards on current page (for Page 1)
        async function parseCardsFromPage(page) {
            return await page.evaluate(() => {
                const results = [];
                const listItems = document.querySelectorAll('ul.cardlist-Result_List_Txt li');

                listItems.forEach(li => {
                    try {
                        const numberEl = li.querySelector('.number');
                        const nameEl = li.querySelector('.name');
                        const imgEl = li.querySelector('.img img');

                        if (!numberEl || !nameEl) return;

                        const id = numberEl.innerText.trim();
                        const name = nameEl.innerText.trim();
                        const imageUrl = imgEl ? imgEl.src : '';

                        // Helper to finding values in DL lists
                        // Helper to finding values in DL lists
                        const getDdValue = (dtText) => {
                            const dts = Array.from(li.querySelectorAll('dt'));
                            const targetDt = dts.find(dt => dt.innerText.includes(dtText));
                            if (targetDt && targetDt.nextElementSibling && targetDt.nextElementSibling.tagName === 'DD') {
                                return targetDt.nextElementSibling;
                            }
                            return null;
                        };

                        const getDdText = (dtText) => {
                            const dd = getDdValue(dtText);
                            return dd ? dd.innerText.trim() : '';
                        };

                        const getDdAlt = (dtText) => {
                            const dd = getDdValue(dtText);
                            const img = dd ? dd.querySelector('img') : null;
                            return img ? img.alt.trim() : '';
                        };

                        const cardType = getDdText('カードタイプ');
                        const rarity = getDdText('レアリティ');
                        const color = getDdAlt('色');
                        let hp = getDdText('HP');
                        if (!hp) hp = getDdText('LIFE');
                        const bloomLevel = getDdText('Bloomレベル');
                        const tags = getDdText('タグ');
                        const expansion = getDdText('収録商品');

                        results.push({
                            id,
                            name,
                            cardType,
                            rarity,
                            color,
                            hp,
                            bloomLevel,
                            tags,
                            expansion,
                            imageUrl
                        });
                    } catch (e) {
                        console.error(e);
                    }
                });
                return results;
            });
        }

        console.log('⛏️ Scraping Page 1...');
        let allCards = await parseCardsFromPage(page);
        console.log(`Phase 1: Found ${allCards.length} cards on main page.`);

        // Get max_page
        const maxPage = await page.evaluate(() => {
            return (typeof window.max_page !== 'undefined') ? window.max_page : 119;
        });
        console.log(`📄 Detected max pages: ${maxPage}`);

        // Loop for remaining pages
        for (let i = 2; i <= maxPage; i++) {
            process.stdout.write(`\rCreating fetch for page ${i}/${maxPage}...`);
            const pageUrl = `https://hololive-official-cardgame.com/cardlist/cardsearch_ex?keyword=&attribute%5B0%5D=all&expansion_name=&card_kind%5B0%5D=all&rare%5B0%5D=all&bloom_level%5B0%5D=all&parallel%5B0%5D=all&view=text&page=${i}`;

            // We can retrieve the content by navigating or better, using fetch in the page context
            // Using page.evaluate to fetch avoids CORS if we do it from the page
            const newCards = await page.evaluate(async (url) => {
                try {
                    const response = await fetch(url);
                    const html = await response.text();

                    // Parse this HTML snippet
                    // We need to create a temporary container
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;

                    const results = [];
                    const listItems = tempDiv.querySelectorAll('li');

                    listItems.forEach(li => {
                        try {
                            const numberEl = li.querySelector('.number');
                            const nameEl = li.querySelector('.name');
                            const imgEl = li.querySelector('.img img');

                            if (!numberEl || !nameEl) return;

                            const id = numberEl.innerText.trim();
                            const name = nameEl.innerText.trim();
                            const imageUrl = imgEl ? imgEl.src : '';

                            // Helper functions (duplicated here because eval context is isolated)
                            const getDdValue = (dtText) => {
                                const dts = Array.from(li.querySelectorAll('dt'));
                                const targetDt = dts.find(dt => dt.innerText.includes(dtText));
                                if (targetDt && targetDt.nextElementSibling && targetDt.nextElementSibling.tagName === 'DD') {
                                    return targetDt.nextElementSibling;
                                }
                                return null;
                            };

                            const getDdText = (dtText) => {
                                const dd = getDdValue(dtText);
                                return dd ? dd.innerText.trim() : '';
                            };

                            const getDdAlt = (dtText) => {
                                const dd = getDdValue(dtText);
                                const img = dd ? dd.querySelector('img') : null;
                                return img ? img.alt.trim() : '';
                            };

                            const cardType = getDdText('カードタイプ');
                            const rarity = getDdText('レアリティ');
                            const color = getDdAlt('色');
                            let hp = getDdText('HP');
                            if (!hp) hp = getDdText('LIFE');
                            const bloomLevel = getDdText('Bloomレベル');
                            const tags = getDdText('タグ');
                            const expansion = getDdText('収録商品');

                            results.push({
                                id,
                                name,
                                cardType,
                                rarity,
                                color,
                                hp,
                                bloomLevel,
                                tags,
                                expansion,
                                imageUrl
                            });
                        } catch (e) {
                            // ignore errors for single cards
                        }
                    });
                    return results;
                } catch (e) {
                    return [];
                }
            }, pageUrl);

            allCards = allCards.concat(newCards);
            // Random delay to be polite
            await new Promise(r => setTimeout(r, 200));
        }

        console.log('\n✅ Fetch complete.');

        const cards = allCards; // Compatibility with existing code

        if (cards.error) {
            console.error('❌ ' + cards.error);
            const htmlSample = await page.content();
            fs.writeFileSync('debug_dump_text.html', htmlSample);
            console.log('Saved debug_dump_text.html');
        } else {
            console.log(`✅ Scraped ${cards.length} cards.`);

            // Filter out purely "Yell" cards if requested, but user filters might handle it.
            // For now, save all.
            const validCards = cards;

            if (validCards.length < EXPECTED_COUNT_MIN) {
                console.warn(`⚠️ Warning: Scraped only ${validCards.length} cards, which is less than the expected minimum of ${EXPECTED_COUNT_MIN}.`);
                console.warn('This might indicate an issue with scraping or the website structure has changed.');
            }

            // For now, simple save. User said ~52 yell cards.
            const filteredCards = cards.filter(c => !c.name.includes('(エール)')); // Provisional filter

            console.log(`📊 Found ${cards.length} cards.`);
            console.log(`💾 Saving to ${OUTPUT_FILE}...`);

            // Ensure dir exists
            const dir = path.dirname(OUTPUT_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
            console.log('🎉 Done!');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await browser.close();
    }
})();
