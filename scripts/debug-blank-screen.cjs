const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

    try {
        await page.setViewport({ width: 1280, height: 800 });
        // 0. Load page
        const url = `http://localhost:5177?v=${Date.now()}`;
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });

        // 1. Switch to Hololive Mode
        console.log('waiting for buttons...');
        await page.waitForSelector('button', { timeout: 10000 });

        const modeBtnHandle = await page.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.find(b => b.innerText.includes('Hololive') || b.innerText.includes('ホロライブ'));
        });

        const modeBtn = modeBtnHandle.asElement();
        if (!modeBtn) throw new Error("Mode button not found");

        console.log('Clicking Hololive OCG...');
        await modeBtn.click();

        // Wait a bit for render
        await new Promise(r => setTimeout(r, 2000));

        // 2. Check Card Count
        const cardCount = await page.$$eval('.card-hover-group', els => els.length);
        console.log(`Initial Card Count: ${cardCount}`);

        if (cardCount === 0) {
            console.error("FAIL: No cards displayed on initial load.");
            await page.screenshot({ path: 'debug-blank-initial.png' });
        } else {
            console.log("PASS: Cards displayed.");
            await page.screenshot({ path: 'debug-success-initial.png' });
        }

    } catch (e) {
        console.error('Script Error:', e);
        await page.screenshot({ path: 'debug-fatal-error.png' });
    } finally {
        await browser.close();
    }
})();
