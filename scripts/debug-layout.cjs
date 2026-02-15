const puppeteer = require('puppeteer');

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
        const url = `http://localhost:5177?v=${Date.now()}`;
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });

        // Switch to Hololive
        console.log('waiting for buttons...');
        await page.waitForSelector('button', { timeout: 10000 });
        const modeBtn = await page.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.find(b => b.innerText.includes('Hololive') || b.innerText.includes('ホロライブ'));
        });
        if (!modeBtn.asElement()) throw new Error("Mode btn not found");
        await modeBtn.asElement().click();
        await new Promise(r => setTimeout(r, 2000));

        // Check Dimensions
        const dimensions = await page.evaluate(() => {
            const grid = document.querySelector('.grid.gap-4');
            const searchTab = grid?.parentElement; // The absolute inset-0 div
            const container = searchTab?.parentElement; // The flex-1 relative

            const getDim = (el) => {
                if (!el) return 'NOT FOUND';
                const rect = el.getBoundingClientRect();
                return { width: rect.width, height: rect.height, top: rect.top, visible: rect.height > 0 && rect.width > 0 };
            };

            return {
                grid: getDim(grid),
                searchTab: getDim(searchTab),
                container: getDim(container)
            };
        });

        console.log('Layout Dimensions:', JSON.stringify(dimensions, null, 2));

        if (dimensions.grid === 'NOT FOUND' || !dimensions.grid.visible) {
            console.error('FAIL: Grid is not visible!');
            await page.screenshot({ path: 'debug-layout-fail.png' });
        } else {
            console.log('PASS: Grid is visible.');
            await page.screenshot({ path: 'debug-layout-success.png' });
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
