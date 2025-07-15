import fs from 'fs/promises';
import { chunkText } from './utils/chunkText.js';
import { getEmbedding } from './embedding.js';
import { supabase } from './supabaseClient.js';

const raw = await fs.readFile('./docs.json', 'utf-8');
const docs = JSON.parse(raw);

for (const { url, text } of docs) {
  const chunks = chunkText(text);

  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);

    await supabase.from('documents').insert({
      content: chunk,
      source: url,
      embedding,
    });

    console.log(`📌 Inserted chunk from ${url}`);
  }
}
