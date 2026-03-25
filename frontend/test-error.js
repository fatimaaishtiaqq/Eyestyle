import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });

    console.log('Navigating to product page...');
    await page.goto('http://localhost:5173/product/69a768092286c9facee83f0d', { waitUntil: 'networkidle2' });
    console.log('Done.');

    await browser.close();
})();
