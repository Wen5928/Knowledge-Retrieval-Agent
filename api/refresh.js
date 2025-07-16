// api/refresh.js
import { listPages, scrapePageText } from '../fetchAndCrawl.js';
import { chunkText }          from '../chunkText.js';
import { getEmbedding }       from '../lib/embedding.js';
import { supabase }           from '../lib/supabaseClient.js';

export default async function handler(req, res) {
  // (Optional) protect this with a secret header
  const secret = req.headers['x-refresh-secret'];
  if (secret !== process.env.REFRESH_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const pages = await listPages();      // from your fetchAndCrawl script
    for (const { path, title } of pages) {
      const text = await scrapePageText(path);
      const chunks = chunkText(text);
      for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk);
        await supabase
          .from('documents')
          .upsert({ source: path, content: chunk, embedding }, { onConflict: ['source','content'] });
      }
    }
    return res.json({ ok: true, count: pages.length });
  } catch (err) {
    console.error('❌ refresh error', err);
    return res.status(500).json({ error: err.message });
  }
}
