// embedAndUpload.js
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { chunkText } from './chunkText.js';           // 根据你的文件结构调整路径
import { getEmbedding } from './embedding.js';
import { supabase } from './supabaseClient.js';

dotenv.config();  // 确保环境变量已加载

async function main() {
  try {
    // 1. 读取并解析 docs.json
    const raw = await fs.readFile('./docs.json', 'utf-8');
    const docs = JSON.parse(raw);
    console.log(`📝 Loaded ${docs.length} documents from docs.json`);

    let totalInserted = 0;
    // 2. 遍历每个页面
    for (const { url, text } of docs) {
      const chunks = chunkText(text, 500);
      console.log(`📄 "${url}" → ${chunks.length} chunks`);

      // 3. 遍历每个 chunk
      for (const chunk of chunks) {
        let embedding;
        try {
          embedding = await getEmbedding(chunk);
        } catch (err) {
          console.error('⚠️  Embedding failed:', err.message);
          continue;  // 跳过出错的 chunk
        }

        // 4. 插入 Supabase
        const { data, error } = await supabase
          .from('documents')
          .insert([{ content: chunk, source: url, embedding }]);

        if (error) {
          console.error('❌  Supabase insert error:', error.message);
        } else {
          totalInserted++;
          console.log(`✅  Inserted chunk #${totalInserted}`);
        }
      }
    }

    console.log(`🎉 Done! Total chunks inserted: ${totalInserted}`);
  } catch (err) {
    console.error('❌  embedAndUpload.js failed:', err);
  }
}

main();
