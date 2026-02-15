const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Load Card Data for verification
const cardDataPath = path.join(__dirname, '../src/data/hololive-cards.json');
const cards = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'));

// Helper to look up card color by name
const getCardColor = (name) => {
    const card = cards.find(c => c.name === name);
    return card ? card.color : 'UNKNOWN';
};

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    try {
        await page.setViewport({ width: 1280, height: 800 });
        // 0. Load page
        const url = `http://localhost:5177?v=${Date.now()}`;
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });

        // 1. Switch to Hololive Mode
        console.log('waiting for buttons...');
        await page.waitForSelector('button', { timeout: 10000 });

        const modeBtnHandle = await page.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.find(b => b.innerText.includes('Hololive') || b.innerText.includes('ホロライブ'));
        });

        const modeBtn = modeBtnHandle.asElement();

        if (!modeBtn) {
            console.log('Mode button not found.');
            await page.screenshot({ path: 'debug-error-modeBtn.png' });
            throw new Error(`Mode button not found.`);
        }

        console.log('Clicking Hololive OCG...');
        await modeBtn.click();

        // Wait for UI
        try {
            await page.waitForSelector('.card-hover-group', { timeout: 10000 });
        } catch (e) {
            console.log("Card grid not found. Taking screenshot...");
            await page.screenshot({ path: 'debug-error-grid.png' });
            throw e;
        }

        // 2. Click "Red" Filter
        console.log('Finding "Red" filter button...');
        const redBtn = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.textContent && b.textContent.includes('赤'));
        });

        // Add DOM details to scraper (INITIAL)
        const domDetailsInitial = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('.group.cursor-pointer'));
            return elements.map((el, index) => {
                const nameEl = el.querySelector('h3');
                const colorEl = el.querySelector('.text-xs.text-gray-400');
                const name = nameEl ? nameEl.textContent.trim() : 'Unknown';
                const colorText = colorEl ? colorEl.textContent.trim() : 'Unknown';

                // Debug details for first few items
                if (index < 5) {
                    console.log(`[DEBUG SCRAPER INITIAL] Item ${index}: Name="${name}", Classes="${el.className}", Parent="${el.parentElement.className}"`);
                }

                return `${name} -> ${colorText}`;
            });
        });
        console.log('DOM Details Initial (first few items):', domDetailsInitial.slice(0, 5));


        if (!redBtn) {
            await page.screenshot({ path: 'debug-error-filter.png' });
            throw new Error("Red filter button not found!");
        }

        console.log('Clicking "Red" filter...');
        await redBtn.click();

        // Wait for React to update
        await new Promise(r => setTimeout(r, 1500));

        // 3. Scrape Displayed Cards
        console.log('Scraping displayed cards...');

        // Add DOM details to scraper (RED)
        const domDetailsRed = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('.group.cursor-pointer'));
            return elements.map((el, index) => {
                const nameEl = el.querySelector('h3');
                const colorEl = el.querySelector('.text-xs.text-gray-400');
                const name = nameEl ? nameEl.textContent.trim() : 'Unknown';
                const colorText = colorEl ? colorEl.textContent.trim() : 'Unknown';

                // Debug details for first few items
                if (index < 5) {
                    console.log(`[DEBUG SCRAPER RED] Item ${index}: Name="${name}", Classes="${el.className}", Parent="${el.parentElement.className}"`);
                }

                return `${name} -> ${colorText}`;
            });
        });
        console.log('DOM Details Red (first few items):', domDetailsRed.slice(0, 5));

        const displayedNames = await page.$$eval('.card-hover-group img', imgs => imgs.map(img => img.alt));

        console.log(`Found ${displayedNames.length} cards displayed.`);

        await page.screenshot({ path: 'debug-red-results.png' });

        // 4. Verify Colors
        const redFilterCheck = [];
        let errorCount = 0;
        displayedNames.slice(0, 20).forEach((name, i) => { // Check first 20
            const color = getCardColor(name);
            console.log(`[${i + 1}] ${name} -> Color: ${color}`);

            if (!color || !color.includes('赤')) {
                console.error(`❌ INVALID MATCH: ${name} is ${color}, but Filter is Red!`);
                redFilterCheck.push({ name, color });
            }
        });

        if (redFilterCheck.length > 0) {
            console.error(`\nFAILED: Found ${redFilterCheck.length} non-Red cards in Red filter results.`);
            await page.screenshot({ path: 'debug-red-results.png', fullPage: true });
            // process.exit(1); 
        } else {
            console.log('\nPASSED: All sampled cards are Red.');
        }

    } catch (e) {
        console.error('Error:', e);
        if (!e.message.includes('screenshot')) {
            await page.screenshot({ path: 'debug-error-catch.png' });
        }
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
