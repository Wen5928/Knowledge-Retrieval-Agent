// api/ask.js

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getEmbedding } from '../lib/embedding.js';
import { supabase } from '../lib/supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config();

res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    // 1. Embed the question
    const queryEmbedding = await getEmbedding(question);

    // 2. Retrieve top-5 matches
    const { data: docs, error } = await supabase
      .rpc('match_documents', {
        match_count:     5,
        match_threshold: 0.78,
        query_embedding: queryEmbedding
      });
    if (error) throw error;
    if (!docs?.length) {
      return res.json({ answer: "I’m sorry, I don't have that information right now." });
    }

    // 3. Build context
    const context = docs.map(d => `Source: ${d.source}\n${d.content}`)
                        .join('\n\n---\n\n');

    // 4. Few-shot + retrieval prompt
    const messages = [
      {
        role: 'system',
        content: `
You are ABConvert’s expert assistant.
Use the documentation snippets to answer succinctly and cite sources.

Example:
Documentation snippets:
Source: https://.../pricing-tests
- A vs B price
User question: What pricing tests can I run?
Assistant:
• A vs B price tests
[Source: https://.../pricing-tests]

Now you:
Documentation snippets:
${context}

User question: ${question}`
      }
    ];

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages
    });

    const answer = chat.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
