import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    console.log('Navigating to http://localhost:5174/');
    await page.goto('http://localhost:5174/');

    // Wait for network idle or 3 seconds
    await new Promise(r => setTimeout(r, 6000));

    // Click first product card
    const productCard = await page.$('a[href^="/product/"]');
    if (productCard) {
        console.log('Found product card, clicking...');
        await productCard.click();
        await new Promise(r => setTimeout(r, 8000)); // wait for details page to render and crash
    } else {
        console.log('No product link found on home page');
    }

    await browser.close();
})();
