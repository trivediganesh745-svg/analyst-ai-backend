require('dotenv').config();
const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const config = require('./config');
const scrapers = require('./scrapers');

const app = express();
const PORT = process.env.PORT || 3001;
const marketCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

app.use(cors({ origin: process.env.FRONTEND_URL || '*' })); // Allow all for now

async function retry(fn, { retries, delay, factor }) {
    for (let i = 0; i <= retries; i++) {
        try { return await fn(); } catch (error) {
            if (i < retries) {
                await new Promise(res => setTimeout(res, delay));
                delay *= factor;
            } else { throw error; }
        }
    }
}

async function fetchFreshMarketData() {
    console.log("Fetching fresh market data...");
    let finalData = {};
    const sourcesAttempted = [];
    for (const source of config.DATA_SOURCES) {
        sourcesAttempted.push(source.name);
        try {
            const scrapeFunction = scrapers[source.scrapeFunc];
            const sourceData = await retry(() => scrapeFunction(source), config.RETRY_CONFIG);
            finalData = { ...sourceData, ...finalData };
            finalData.source = source.name;
            console.log(`Success from ${source.name}`);
            break;
        } catch (error) {
            console.warn(`Source ${source.name} failed:`, error.message);
        }
    }
    if (!finalData.source) throw new Error("All data sources failed.");
    finalData.sourcesAttempted = sourcesAttempted;
    finalData.timestamp = new Date().toISOString();
    return finalData;
}

app.get('/api/market-data', async (req, res) => {
    const cacheKey = 'live_market_data';
    try {
        const cachedData = marketCache.get(cacheKey);
        if (cachedData) {
            console.log("CACHE HIT");
            return res.status(200).json(cachedData);
        }
        console.log("CACHE MISS");
        const freshData = await fetchFreshMarketData();
        marketCache.set(cacheKey, freshData);
        return res.status(200).json(freshData);
    } catch (error) {
        console.error("API Error:", error.message);
        return res.status(502).json({ error: "Bad Gateway", message: "All upstream data sources failed." });
    }
});

app.listen(PORT, () => console.log(`BFF Server running on http://localhost:${PORT}`));
