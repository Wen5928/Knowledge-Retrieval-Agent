// testEmbedding.js
import dotenv from 'dotenv';
import { getEmbedding } from './lib/embedding.js';

dotenv.config();

async function main() {
  const sampleText = 'This is a test for embedding vector.';
  console.log('🔍 Generating embedding for:', sampleText);

  try {
    const vector = await getEmbedding(sampleText);
    console.log('✅ Embedding vector:', vector);
    console.log('Vector length:', vector.length);
  } catch (err) {
    console.error('❌ Failed to generate embedding:', err);
  }
}

main();
