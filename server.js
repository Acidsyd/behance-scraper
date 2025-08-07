const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/scrape-behance', async (req, res) => {
  const keyword = req.query.q || '3d';
  const url = `https://www.behance.net/search/projects/?search=${encodeURIComponent(keyword)}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

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
    console.error('Scraping error:', err);
    res.status(500).json({ error: 'Scraping failed' });
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});


