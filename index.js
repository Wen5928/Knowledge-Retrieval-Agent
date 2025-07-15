import express from 'express';
import dotenv from 'dotenv';
import { getEmbedding } from './embedding.js';
import { supabase } from './supabaseClient.js';
import OpenAI from 'openai';

dotenv.config();
const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  const queryEmbedding = await getEmbedding(question);

  const { data } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.78,
    match_count: 5,
  });

  const context = data.map(d => d.content).join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are ABConvert’s expert assistant. Use the following context to answer the user’s question accurately.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  res.json({ answer: completion.choices[0].message.content });
});

app.listen(3000, () => console.log('🚀 Agent listening on http://localhost:3000'));
