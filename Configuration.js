module.exports = {
    RETRY_CONFIG: { retries: 2, delay: 1000, factor: 2 },
    PUPPETEER_TIMEOUT: 15000,
    DATA_SOURCES: [
        {
            name: 'Moneycontrol',
            url: 'https://www.moneycontrol.com/indian-indices/',
            scrapeFunc: 'scrapeFromMoneycontrol',
        },
    ]
};
