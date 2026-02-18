import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = 'https://hololive-official-cardgame.com/cardlist/cardsearch/?keyword=&attribute%5B%5D=all&expansion_name=&card_kind%5B%5D=all&rare%5B%5D=all&bloom_level%5B%5D=all&parallel%5B%5D=all&view=text'; // Switched to text view
const OUTPUT_FILE = path.join(__dirname, '../src/data/hololive-cards.json');
const KANA_DICT_FILE = path.join(__dirname, '../src/data/kana-dictionary.json');
const EXPECTED_COUNT_MIN = 1700; // Expected ~1725

const IS_DEV = process.env.DEV === 'true';
const CACHED_PAGE_DIR = path.join(__dirname, 'cache/hololive');

// Ensure cache dir exists
if (!fs.existsSync(CACHED_PAGE_DIR)) {
    fs.mkdirSync(CACHED_PAGE_DIR, { recursive: true });
}

// Load kana dictionary
let kanaDict = {};
if (fs.existsSync(KANA_DICT_FILE)) {
    kanaDict = JSON.parse(fs.readFileSync(KANA_DICT_FILE, 'utf-8'));
}

function generateKana(card) {
    const textToAnalyze = card.name;

    let kanaResult = new Set();

    // Check dictionary for keywords
    // Sort keys by length descending to match longest possible keywords first
    const sortedKeys = Object.keys(kanaDict).sort((a, b) => b.length - a.length);

    // Simple keyword extraction
    for (const key of sortedKeys) {
        if (textToAnalyze.includes(key)) {
            kanaResult.add(kanaDict[key]);
        }
    }

    return Array.from(kanaResult).join(' ');
}

(async () => {
    console.log(`🚀 Starting Hololive Card Data Fetcher (Text Mode)... ${IS_DEV ? '[DEV MODE]' : ''}`);
    console.log(`📡 Target URL: ${TARGET_URL}`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 800 });

    try {
        const cacheFile1 = path.join(CACHED_PAGE_DIR, 'page_1.html');
        if (IS_DEV && fs.existsSync(cacheFile1)) {
            console.log('📦 Loading Page 1 from cache...');
            const cachedHtml = fs.readFileSync(cacheFile1, 'utf-8');
            await page.setContent(cachedHtml, { waitUntil: 'networkidle2' });
        } else {
            console.log('🌐 Fetching Page 1 from official site...');
            await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
            if (IS_DEV) {
                const html = await page.content();
                fs.writeFileSync(cacheFile1, html);
                console.log('💾 Page 1 cached.');
            }
        }

        // --- ENHANCEMENT: Pre-check Count ---
        console.log('🔍 Checking total card count for updates...');
        const stats = await page.evaluate(() => {
            // Try specific selector based on observed HTML
            const selectors = [
                '.cardlist-Result_Target_Num .num', // Direct hit based on shared HTML
                '.cardlist-Result_Target_Num',
                '.cardlist-Result_Count span:last-child',
                '.cardlist-Result_Count'
            ];

            let total = 0;
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) {
                    const text = el.innerText.replace(/,/g, '');
                    const match = text.match(/([0-9]+)/);
                    if (match) {
                        total = parseInt(match[1], 10);
                        if (total > 0) break;
                    }
                }
            }

            // Fallback: search all text for "全XXX件" or "検索結果XXX件" pattern
            if (total === 0) {
                const bodyText = document.body.innerText;
                const match = bodyText.match(/(?:全|検索結果)\s*([0-9,]+)\s*件/);
                if (match) {
                    total = parseInt(match[1].replace(/,/g, ''), 10);
                }
            }

            const maxPage = (typeof window.max_page !== 'undefined') ? window.max_page : 1;
            return { total, maxPage };
        });

        console.log(`📊 Current official site total: ${stats.total} cards (${stats.maxPage} pages)`);

        // Get local count
        if (fs.existsSync(OUTPUT_FILE)) {
            const localData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
            const localCount = Array.isArray(localData) ? localData.length : 0;
            console.log(`🏠 Local data total: ${localCount} cards`);

            if (!IS_DEV && stats.total > 0 && stats.total === localCount) {
                console.log('✅ Card counts match. No new cards detected. Skipping remaining process.');
                await browser.close();
                process.exit(0);
            }
            if (stats.total > 0 && stats.total < localCount) {
                console.log('⚠️ Official count is lower than local (rare/deletion?). Proceeding to re-fetch just in case.');
            } else {
                console.log(IS_DEV ? '🛠️ Dev mode: ignoring match check. Proceeding to fetch...' : '🆕 New cards detected! Proceeding to fetch...');
            }
        }
        // ------------------------------------

        console.log('📜 Scrolling or navigating to load all cards...');

        // Helper function to parsing visible cards on current page (for Page 1)
        async function parseCardsFromPage(page, baseUrl) {
            return await page.evaluate((baseUrl) => {
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

                        // Get absolute URL for original image
                        let originalImageUrl = imgEl ? imgEl.src : '';
                        if (originalImageUrl && !originalImageUrl.startsWith('http') && baseUrl) {
                            const cleanBase = baseUrl.replace(/\/$/, '');
                            const cleanPath = originalImageUrl.replace(/^\//, '');
                            originalImageUrl = `${cleanBase}/${cleanPath}`;
                        }

                        // Determine local image path
                        let imageUrl = originalImageUrl;
                        if (originalImageUrl) {
                            const filename = originalImageUrl.split('/').pop();
                            imageUrl = `/images/cards/${filename}`;
                        }

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

                        const cleanText = (text) => {
                            if (!text) return '';
                            return text.replace(/\n\s*\n/g, '\n').trim();
                        };

                        const cardType = getDdText('カードタイプ');
                        const rarity = getDdText('レアリティ');
                        const color = getDdAlt('色');
                        let hp = getDdText('HP');
                        if (!hp) hp = getDdText('LIFE');
                        const bloomLevel = getDdText('Bloomレベル');
                        const tags = getDdText('タグ');
                        const expansion = getDdText('収録商品');

                        const cardData = {
                            id, name, cardType, rarity, color, hp, bloomLevel, tags, expansion, imageUrl, originalImageUrl,
                            oshiSkills: [], arts: [], keywords: [], abilityText: '', extra: '', limited: false, batonTouch: ''
                        };

                        // 1. Oshi Skills
                        li.querySelectorAll('.skill').forEach(skillEl => {
                            const label = skillEl.querySelector('p:first-child')?.innerText.trim() || '';
                            const contentPara = skillEl.querySelector('p:nth-child(2)');
                            if (!contentPara) return;
                            const fullText = contentPara.innerText.trim();
                            const skillName = contentPara.querySelector('span')?.innerText.trim() || '';
                            const costMatch = fullText.match(/\[ホロパワー：([^\]]+)\]/);
                            const cost = costMatch ? costMatch[1] : '';
                            let text = fullText;
                            if (skillName) {
                                const parts = fullText.split(skillName);
                                text = parts.length > 1 ? parts[1].trim() : fullText;
                            }
                            if (cost) text = text.replace(`[ホロパワー：${cost}]`, '').trim();
                            cardData.oshiSkills.push({ label, name: skillName, cost, text: cleanText(text) });
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
                            const effectText = contentPara.innerText.replace(fullSpanText, '').trim();
                            cardData.arts.push({ name: fullSpanText.replace(damage || '', '').replace(tokkouEl?.innerText.trim() || '', '').trim(), costs, damage, tokkou, text: cleanText(effectText) });
                        });

                        // 3. Keywords
                        li.querySelectorAll('.keyword').forEach(kwEl => {
                            const contentPara = kwEl.querySelector('p:nth-child(2)');
                            if (!contentPara) return;
                            const span = contentPara.querySelector('span');
                            const typeIcon = span?.querySelector('img')?.alt.trim() || '';
                            const kwName = span?.innerText.trim() || '';
                            const text = contentPara.innerText.replace(kwName, '').trim();
                            cardData.keywords.push({ type: typeIcon, name: kwName, text: cleanText(text) });
                        });

                        // 4. Ability Text
                        const abilityDt = Array.from(li.querySelectorAll('dt')).find(dt => dt.innerText.includes('能力テキスト'));
                        if (abilityDt && abilityDt.nextElementSibling) {
                            let text = abilityDt.nextElementSibling.innerText.trim();
                            const limitedStr = 'LIMITED：ターンに1枚しか使えない。';
                            if (text.includes(limitedStr) || cardType.includes('LIMITED')) {
                                cardData.limited = true;
                                text = text.replace(limitedStr, '').trim();
                            }
                            cardData.abilityText = cleanText(text);
                        }

                        // 5. Extra
                        const extraEls = li.querySelectorAll('.extra p:nth-child(2)');
                        if (extraEls.length > 0) {
                            cardData.extra = cleanText(Array.from(extraEls).map(el => el.innerText.trim()).join('\n'));
                        }

                        // 6. Baton Touch
                        cardData.batonTouch = getDdAlt('バトンタッチ');

                        results.push(cardData);
                    } catch (e) {
                        console.error(e);
                    }
                });
                return results;
            });
        }

        console.log('⛏️ Scraping Page 1...');
        const targetOrigin = new URL(TARGET_URL).origin;
        let allCards = await parseCardsFromPage(page, targetOrigin);
        console.log(`Phase 1: Found ${allCards.length} cards on main page.`);

        // Get max_page
        const maxPage = await page.evaluate(() => {
            return (typeof window.max_page !== 'undefined') ? window.max_page : 119;
        });
        console.log(`📄 Detected max pages: ${maxPage}`);

        // Loop for remaining pages
        let failedPages = 0;
        for (let i = 2; i <= stats.maxPage; i++) {
            process.stdout.write(`\rCreating fetch for page ${i}/${stats.maxPage}...`);
            const pageUrl = `https://hololive-official-cardgame.com/cardlist/cardsearch_ex?keyword=&attribute%5B0%5D=all&expansion_name=&card_kind%5B0%5D=all&rare%5B0%5D=all&bloom_level%5B0%5D=all&parallel%5B0%5D=all&view=text&page=${i}`;

            let html = '';
            const cacheFile = path.join(CACHED_PAGE_DIR, `page_${i}.html`);

            if (IS_DEV && fs.existsSync(cacheFile)) {
                html = fs.readFileSync(cacheFile, 'utf-8');
            } else {
                html = await page.evaluate(async (url) => {
                    try {
                        const response = await fetch(url);
                        return await response.text();
                    } catch (e) {
                        return '';
                    }
                }, pageUrl);

                if (IS_DEV && html && html.trim()) {
                    fs.writeFileSync(cacheFile, html);
                }
            }

            if (!html || !html.trim()) {
                failedPages++;
                console.log(`\n❌ Failed to fetch page ${i}. (Total failures: ${failedPages})`);
                if (failedPages >= 3) break;
                continue;
            }

            const newCards = await page.evaluate((htmlSnippet) => {
                try {
                    // Parse this HTML snippet
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlSnippet;

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

                            // Get absolute URL for original image
                            let originalImageUrl = imgEl ? imgEl.src : '';
                            if (originalImageUrl && !originalImageUrl.startsWith('http')) {
                                // Since this is inside AJAX response evaluation, target domain is same
                                originalImageUrl = new URL(originalImageUrl, "https://hololive-official-cardgame.com").href;
                            }

                            // Determine local image path
                            let imageUrl = originalImageUrl;
                            if (originalImageUrl) {
                                const filename = originalImageUrl.split('/').pop();
                                imageUrl = `/images/cards/${filename}`;
                            }

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

                            const cleanText = (text) => {
                                if (!text) return '';
                                return text.replace(/\n\s*\n/g, '\n').trim();
                            };

                            const cardType = getDdText('カードタイプ');
                            const rarity = getDdText('レアリティ');
                            const color = getDdAlt('色');
                            let hp = getDdText('HP');
                            if (!hp) hp = getDdText('LIFE');
                            const bloomLevel = getDdText('Bloomレベル');
                            const tags = getDdText('タグ');
                            const expansion = getDdText('収録商品');

                            const cardData = {
                                id,
                                name,
                                cardType,
                                rarity,
                                color,
                                hp,
                                bloomLevel,
                                tags,
                                expansion,
                                imageUrl,
                                originalImageUrl,
                                oshiSkills: [],
                                arts: [],
                                keywords: [],
                                abilityText: '',
                                extra: '',
                                limited: false,
                                batonTouch: ''
                            };

                            // 1. Oshi Skills
                            li.querySelectorAll('.skill').forEach(skillEl => {
                                const label = skillEl.querySelector('p:first-child')?.innerText.trim() || '';
                                const contentPara = skillEl.querySelector('p:nth-child(2)');
                                if (!contentPara) return;

                                const fullText = contentPara.innerText.trim();
                                const skillName = contentPara.querySelector('span')?.innerText.trim() || '';

                                const costMatch = fullText.match(/\[ホロパワー：([^\]]+)\]/);
                                const cost = costMatch ? costMatch[1] : '';

                                let text = fullText;
                                if (skillName) {
                                    const parts = fullText.split(skillName);
                                    text = parts.length > 1 ? parts[1].trim() : fullText;
                                }
                                if (cost) {
                                    text = text.replace(`[ホロパワー：${cost}]`, '').trim();
                                }

                                cardData.oshiSkills.push({ label, name: skillName, cost, text: cleanText(text) });
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

                                cardData.arts.push({
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

                                cardData.keywords.push({
                                    type: typeIcon,
                                    name: kwName,
                                    text: cleanText(text)
                                });
                            });

                            // 4. Ability Text (Support) & LIMITED check
                            const abilityDt = Array.from(li.querySelectorAll('dt'))
                                .find(dt => dt.innerText.includes('能力テキスト'));
                            if (abilityDt && abilityDt.nextElementSibling) {
                                let text = abilityDt.nextElementSibling.innerText.trim();
                                const limitedStr = 'LIMITED：ターンに1枚しか使えない。';
                                if (text.includes(limitedStr) || cardType.includes('LIMITED')) {
                                    cardData.limited = true;
                                    text = text.replace(limitedStr, '').trim();
                                }
                                cardData.abilityText = cleanText(text);
                            }

                            // 5. Extra
                            const extraEls = li.querySelectorAll('.extra p:nth-child(2)');
                            if (extraEls.length > 0) {
                                cardData.extra = cleanText(Array.from(extraEls).map(el => el.innerText.trim()).join('\n'));
                            }

                            // 6. Baton Touch
                            cardData.batonTouch = getDdAlt('バトンタッチ');

                            results.push(cardData);
                        } catch (e) {
                            // ignore errors for single cards
                        }
                    });
                    return results;
                } catch (e) {
                    return [];
                }
            }, html);

            allCards = allCards.concat(newCards);

            if (newCards.length === 0) {
                failedPages++;
                console.log(`\n❌ Failed to fetch page ${i}. (Total failures: ${failedPages})`);
            } else {
                // Success: reset consecutive failure count if we want, 
                // but let's keep a total failure budget for the whole run.
            }

            if (failedPages >= 3) {
                throw new Error('Too many page fetch failures. Aborting update to prevent data corruption.');
            }

            // Random delay to be polite
            await new Promise(r => setTimeout(r, 300));
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

            const enrichedCards = cards.map(c => ({
                ...c,
                kana: generateKana(c)
            }));

            console.log(`📊 Found ${enrichedCards.length} cards.`);
            console.log(`💾 Saving to ${OUTPUT_FILE}...`);

            // Ensure dir exists
            const dir = path.dirname(OUTPUT_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedCards, null, 2));
            console.log('🎉 Done!');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await browser.close();
    }
})();
