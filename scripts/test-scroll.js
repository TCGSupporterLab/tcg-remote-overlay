
import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting scroll verification test...');
    // Launch with headless: true (default) or false to see it
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        // 1. Navigate to the app (Updated Port)
        console.log('Navigating to http://localhost:5177...');
        await page.goto('http://localhost:5177', { waitUntil: 'networkidle0' });

        await page.setViewport({ width: 1280, height: 720 });

        // 2. Switch to Hololive Mode
        console.log('Searching for "ホロライブOCG" button...');
        try {
            await page.waitForSelector('button', { timeout: 10000 });
        } catch (e) {
            throw new Error('Timeout waiting for buttons to load. Page might be blank.');
        }

        const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const holoButton = buttons.find(b => b.innerText.includes('ホロライブOCG'));
            if (holoButton) {
                holoButton.click();
                return true;
            }
            return false;
        });

        if (!clicked) {
            // Debug: Log all buttons
            const buttonTexts = await page.$$eval('button', els => els.map(e => e.innerText));
            console.log('Available buttons:', buttonTexts);
            throw new Error('Could not find "ホロライブOCG" button');
        }
        console.log('Switched to Hololive Mode.');

        // 3. Wait for the card grid
        console.log('Waiting for card grid...');
        try {
            await page.waitForSelector('.grid', { timeout: 10000 });
        } catch (e) {
            throw new Error('Card grid (.grid) not found after switching mode.');
        }

        // 4. Inspect Parent
        console.log('Inspecting grid parent...');
        const parentInfo = await page.evaluate(() => {
            const grid = document.querySelector('.grid');
            if (!grid) return null;

            const parent = grid.parentElement;
            if (!parent) return null;

            const style = window.getComputedStyle(parent);

            // Try to scroll
            const startTop = parent.scrollTop;
            parent.scrollTop = 500;
            const endTop = parent.scrollTop;

            return {
                className: parent.className,
                tagName: parent.tagName,
                computedStyle: {
                    overflowY: style.overflowY,
                    position: style.position,
                    height: style.height,
                    width: style.width,
                    inset: style.inset,
                    top: style.top,
                    bottom: style.bottom
                },
                dimensions: {
                    clientHeight: parent.clientHeight,
                    scrollHeight: parent.scrollHeight,
                    scrollTopStart: startTop,
                    scrollTopEnd: endTop
                }
            };
        });

        console.log('Parent Info:', JSON.stringify(parentInfo, null, 2));

        if (parentInfo && parentInfo.dimensions.clientHeight > 0 && parentInfo.dimensions.scrollHeight > parentInfo.dimensions.clientHeight) {
            if (parentInfo.dimensions.scrollTopEnd > parentInfo.dimensions.scrollTopStart) {
                console.log('SUCCESS: Scroll verified.');
            } else {
                console.log('WARNING: Scrollable dimensions exist but scrollTop did not change. Maybe already at bottom? (Unlikely)');
            }
        } else {
            console.log('FAILURE: Parent is not scrollable.');
        }

        // Take screenshot
        await page.screenshot({ path: 'scroll-test-result.png' });
        console.log('Screenshot saved.');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
