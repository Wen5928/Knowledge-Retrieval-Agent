// countChunks.js
import fs from 'fs/promises';
import { chunkText } from './utils/chunkText.js';

async function main() {
  const raw = await fs.readFile('./docs.json', 'utf-8');
  const docs = JSON.parse(raw);

  let total = 0;
  for (const { url, text } of docs) {
    const chunks = chunkText(text, 500);
    console.log(`- ${url} → ${chunks.length} chunks`);
    total += chunks.length;
  }
  console.log(`\n📝 Expected total chunks: ${total}`);
}

main();
