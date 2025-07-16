// fetchGitbookApi.js
import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

const REST_BASE   = 'https://api.gitbook.com/v1';
const SITE_BASE   = 'https://abconvert.gitbook.io/abconvert-knowledge-base';
const SPACE       = process.env.GITBOOK_SPACE_UID;
const TOKEN       = process.env.GITBOOK_API_TOKEN;

if (!SPACE || !TOKEN) {
  console.error('❌ Please set GITBOOK_SPACE_UID and GITBOOK_API_TOKEN in .env');
  process.exit(1);
}

// 1) Get a list of pages (with path) via REST
async function listPages() {
  const url = `${REST_BASE}/spaces/${SPACE}/content/pages?computed=true&metadata=false`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  return data.pages;  // array of { id, path, title, … }
}

// 2) Fetch & scrape the GitBook page HTML
async function scrapePageText(path) {
  // ensure exactly one slash between BASE and path, and a trailing slash
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const pageUrl   = `${SITE_BASE}/${cleanPath}/`;
  console.log(`🔍 Crawling ${pageUrl}`);
  const html      = await axios.get(pageUrl).then(r => r.data);
  const $         = load(html);
  return $('article').text().trim() || $('main').text().trim();
}

async function main() {
  console.log(`🕵️‍♂️ Fetching page list for space ${SPACE}…`);
  const pages = await listPages();
  console.log(`Found ${pages.length} pages.`);

  const results = [];
  for (const { path, title } of pages) {
    console.log(`→ [${title}] ${path}`);
    try {
      const text = await scrapePageText(path);
      results.push({
        url: `${SITE_BASE}/${path.replace(/^\/+|\/+$/g, '')}/`,
        text
      });
      console.log(`   ✔︎ Fetched ${text.length} chars`);
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
    }
  }

  await fs.writeFile('docs.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log(`✅ docs.json written with ${results.length} entries`);
}

main().catch(err => {
  console.error('❌ fetchGitbookApi.js error:', err);
  process.exit(1);
});
