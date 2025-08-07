const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3001;

// Behance scraper
app.get('/scrape-behance', async (req, res) => {
  const keyword = req.query.q || '3d';
  const url = `https://www.behance.net/search/projects/?search=${encodeURIComponent(keyword)}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    const projects = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('a.qa-project-cover');
      cards.forEach(card => {
        const title = card.querySelector('.Title-title')?.innerText || null;
        const href = card.getAttribute('href');
        const link = href ? `https://www.behance.net${href}` : null;
        if (title && link) items.push({ title, link });
      });
      return items;
    });

    res.json(projects);
  } catch (err) {
    console.error('Behance error:', err.message);
    res.status(500).json({ error: 'Scraping failed', message: err.message });
  } finally {
    await browser.close();
  }
});

// Upwork scraper
app.get('/scrape-upwork', async (req, res) => {
  const keyword = req.query.q || '3d';
  const url = `https://www.upwork.com/ab/find-work/?q=${encodeURIComponent(keyword)}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    await page.waitForSelector('[data-test="job-tile-list"]', { timeout: 10000 });

    const jobs = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('[data-test="job-tile-list"] article');
      cards.forEach(card => {
        const title = card.querySelector('h4')?.innerText.trim() || null;
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
    res.status(500).json({ error: 'Scraping failed', message: err.message });
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ API live on http://localhost:${PORT}`);
});
