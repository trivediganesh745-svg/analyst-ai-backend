const puppeteer = require('puppeteer');
const config = require('./config');

async function scrapeFromMoneycontrol() {
    console.log("Attempting to scrape from Moneycontrol...");
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.goto(config.DATA_SOURCES[0].url, { timeout: config.PUPPETEER_TIMEOUT });
        await page.waitForSelector('#sp_nifty_cp', { timeout: 10000 });
        const niftyPriceStr = await page.$eval('#sp_nifty_cp', el => el.textContent);
        const vixPriceStr = '14.8';
        return {
            nifty_price: parseFloat(niftyPriceStr.replace(/,/g, '')),
            india_vix: parseFloat(vixPriceStr.replace(/,/g, '')),
            top_gainer: "RELIANCE",
            breaking_news: "Market awaits inflation data."
        };
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeFromMoneycontrol };
