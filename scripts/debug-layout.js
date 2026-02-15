
import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1280, height: 720 });
        console.log('Navigating to http://localhost:5177...');
        await page.goto('http://localhost:5177', { waitUntil: 'networkidle0', timeout: 30000 });

        // Switch to Hololive OCG Mode
        console.log('Switching to Hololive OCG mode...');

        // Find button by text content
        const buttons = await page.$$('button');
        let clicked = false;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('ホロライブOCG')) {
                await btn.click();
                clicked = true;
                console.log('Clicked Hololive OCG button');
                break;
            }
        }

        if (!clicked) {
            console.error('Hololive OCG button not found!');
        }

        // Wait for Hololive UI to load (look for "カード検索" text)
        try {
            await page.waitForFunction(
                () => document.body.innerText.includes('カード検索'),
                { timeout: 5000 }
            );
            console.log('Hololive UI loaded (found "カード検索")');
        } catch (e) {
            console.log('Hololive UI did not load or "カード検索" text missing:', e.message);
        }

        // Simulate Hover to reveal badges
        console.log('Simulating hover...');
        try {
            console.log('Waiting for card grid...');
            await page.waitForSelector('.card-hover-group', { timeout: 10000 });

            // Hover logic
            await page.hover('.card-hover-group:first-child');
            await new Promise(r => setTimeout(r, 500)); // Wait for transition
            console.log('Hovered over first card');

            // Inspect the badge
            const badgeOpacity = await page.evaluate(() => {
                const badge = document.querySelector('.card-hover-group:first-child .pin-badge');
                if (!badge) return 'Badge not found';
                const style = window.getComputedStyle(badge);
                return style.opacity;
            });
            console.log('Badge Opacity after hover:', badgeOpacity);

            // Also dump rect to ensure it's on screen
            const badgeRect = await page.evaluate(() => {
                const badge = document.querySelector('.card-hover-group:first-child .pin-badge');
                if (!badge) return null;
                const rect = badge.getBoundingClientRect();
                return { top: rect.top, right: rect.right, width: rect.width, height: rect.height };
            });
            console.log('Badge Rect:', badgeRect);

        } catch (e) {
            console.log('Could not hover or find badge:', e.message);
            // Dump HTML for debugging
            const html = await page.content();
            console.log('Body Text Snippet:', (await page.evaluate(() => document.body.innerText)).substring(0, 500));
        }

        // Take a full page screenshot
        await page.screenshot({ path: 'pin-badge-fix.png', fullPage: true });
        console.log('Screenshot saved to pin-badge-fix.png');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await browser.close();
    }
})();
