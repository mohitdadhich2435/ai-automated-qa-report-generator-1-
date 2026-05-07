import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import * as cheerio from 'cheerio';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Research Website
  app.post('/api/research', async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024 // 5MB limit
      });

      const $ = cheerio.load(response.data);
      
      // Detailed Tag Analysis
      const allTags: Record<string, number> = {};
      $('*').each((i, el) => {
        const name = (el as any).name;
        allTags[name] = (allTags[name] || 0) + 1;
      });

      // Technical Metrics
      const scripts = $('script').map((i, el) => ({
        src: $(el).attr('src'),
        type: $(el).attr('type'),
        isAsync: $(el).attr('async') !== undefined,
        isDefer: $(el).attr('defer') !== undefined
      })).get();

      const styles = $('link[rel="stylesheet"]').map((i, el) => $(el).attr('href')).get();
      const images = $('img').map((i, el) => ({
        src: $(el).attr('src'),
        alt: $(el).attr('alt')
      })).get();

      const forms = $('form').length;
      const divs = $('div').length;
      const spans = $('span').length;
      const semanticTags = ['header', 'footer', 'main', 'nav', 'article', 'section', 'aside'].filter(t => $(t).length > 0);

      // Estimate "Coverage" and "Bloat"
      const pageSize = Buffer.byteLength(response.data, 'utf8');
      
      res.json({
        url,
        title: $('title').text(),
        metaDescription: $('meta[name="description"]').attr('content') || '',
        h1s: $('h1').map((i, el) => $(el).text()).get(),
        technical: {
          pageSize: (pageSize / 1024).toFixed(2) + ' KB',
          tagCount: Object.keys(allTags).length,
          allTags,
          scriptsCount: scripts.length,
          stylesCount: styles.length,
          imagesCount: images.length,
          formsCount: forms,
          divToSemanticRatio: (divs / (semanticTags.length || 1)).toFixed(2),
          hasAltOnAllImages: images.every(img => img.alt && img.alt.trim().length > 0)
        }
      });
    } catch (error) {
      console.error('Scraping Error:', error);
      res.status(500).json({ error: 'Failed to access website. Make sure the URL is correct and public.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
