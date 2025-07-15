// embedding.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();  // 从 .env 加载 OPENAI_API_KEY

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 将文本转换为嵌入向量
 * @param {string} text - 要嵌入的文本
 * @returns {Promise<number[]>} - 1,536 维或相应模型维度的向量
 */
export async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",  // 推荐使用的嵌入模型
      input: text
    });

    const embedding = response.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding returned from OpenAI');
    }
    return embedding;
  } catch (err) {
    console.error('Error generating embedding:', err);
    throw err;
  }
}
