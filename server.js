const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3001;

// Upwork scraper
app.get('/scrape-upwork', async (req, res) => {
  const keyword = req.query.q || '3d';
  const url = `https://www.upwork.com/ab/find-work/?q=${encodeURIComponent(keyword)}`;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let jobs = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('article', { timeout: 15000 });

    jobs = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('article');
      cards.forEach(card => {
        const title = card.querySelector('h4')?.innerText || null;
        const link = card.querySelector('a')?.href || null;
        const budget = card.querySelector('[data-test="budget"]')?.innerText || null;
        const time = card.querySelector('[data-test="posted-on"]')?.innerText || null;
        if (title && link) items.push({ title, link, budget, time });
      });
      return items;
    });

    res.json(jobs);
  } catch (err) {
    console.error('Upwork error:', err.message);
    try {
      const page = (await browser.pages())[0];
      await page.screenshot({ path: 'upwork_error.png', fullPage: true });
    } catch (e) {
      console.warn('Unable to capture screenshot:', e.message);
    }
    res.status(500).json({ error: 'Upwork scraping failed', message: err.message });
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Upwork Scraper API running on http://localhost:${PORT}`);
});
