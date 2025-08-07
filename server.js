app.get('/scrape-upwork', async (req, res) => {
  const keyword = req.query.q || '3d';
  const url = `https://www.upwork.com/ab/find-work/?q=${encodeURIComponent(keyword)}`;

  console.log(`🟢 Scraping Upwork for: ${keyword}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    // Attendi il contenitore dei risultati
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

    console.log(`✅ Upwork scraping complete. Found ${jobs.length} jobs.`);
    res.json(jobs);
  } catch (err) {
    console.error('❌ Upwork scraping error:', err.message);
    res.status(500).json({ error: 'Scraping failed', message: err.message });
  } finally {
    await browser.close();
  }
});
