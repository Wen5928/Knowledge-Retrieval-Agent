// crawlGitbook.js
import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs/promises';
import { URL } from 'url';

const BASE = 'https://abconvert.gitbook.io/abconvert-knowledge-base';

// Normalize a GitBook URL (strip hashes, query, ensure no trailing slash duplicates)
function normalize(url) {
  const u = new URL(url);
  u.hash = '';
  u.search = '';
  return u.href.replace(/\/+$/, '');
}

async function fetchPageUrls(startUrl) {
  const toVisit = [normalize(startUrl)];
  const visited = new Set();
  const pages = [];

  while (toVisit.length) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const { data } = await axios.get(url);
      const $ = load(data);
      pages.push(url);
      console.log(`→ Discovered: ${url}`);

      $('a[href]').each((_, a) => {
        let href = $(a).attr('href');
        if (!href) return;
        try {
          href = new URL(href, BASE).href;
        } catch {
          return;
        }
        if (href.startsWith(BASE) && !href.includes('/assets/') && !href.includes('#')) {
          const norm = normalize(href);
          if (!visited.has(norm) && !toVisit.includes(norm)) {
            toVisit.push(norm);
          }
        }
      });
    } catch (e) {
      console.error(`❌ Failed to crawl ${url}: ${e.message}`);
    }
  }

  return pages;
}

async function fetchTextFromPage(url) {
  const { data } = await axios.get(url);
  const $ = load(data);
  const text = $('article').text().trim() || $('main').text().trim();
  return text;
}

async function main() {
  console.log('🕵️‍♂️  Starting crawlGitbook.js');

  const pageUrls = await fetchPageUrls(BASE);
  const results = [];

  for (const url of pageUrls) {
    try {
      const text = await fetchTextFromPage(url);
      results.push({ url, text });
      console.log(`✅ Fetched: ${url}`);
    } catch (e) {
      console.error(`❌ Failed to fetch text from ${url}: ${e.message}`);
    }
  }

  await fs.writeFile('./docs.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log(`📝 Saved ${results.length} pages to docs.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
