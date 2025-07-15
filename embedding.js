// embedding.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates an embedding vector for the given text using OpenAI's embedding model.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} - The embedding vector (array of floats).
 */
export async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });

  // Return the embedding vector
  return response.data[0].embedding;
}
