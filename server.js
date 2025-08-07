const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/scrape-behance', async (req, res) => {
  const keyword = req.query.q || '3d';
  const url = `https://www.behance.net/search/projects/?search=${encodeURIComponent(keyword)}`;

  console.log(`🟡 [START] Scraping for keyword: "${keyword}"`);
  console.log(`🔗 Navigating to: ${url}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000 // massimo 15s per caricamento pagina
    });

    console.log('✅ Page loaded, extracting projects…');

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

    console.log(`✅ Extraction complete. Found ${projects.length} projects.`);
    res.json(projects);

  } catch (err) {
    console.error('❌ Scraping error:', err.message);
    res.status(500).json({ error: 'Scraping failed', message: err.message });
  } finally {
    await browser.close();
    console.log('🧹 Browser closed');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Behance Scraper API running on http://localhost:${PORT}`);
});
