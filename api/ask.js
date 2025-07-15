// api/ask.js

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getEmbedding } from '../lib/embedding.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase (service_role key bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
    // 1) CORS preflight support
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
    
        return res.status(200).end();
    }

  if (req.method !== 'POST'){
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Missing "question" in request body' });
  }

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
        content:`
            You are ABConvert’s expert assistant.
            Use the provided documentation snippets to answer the user’s question accurately and concisely.\n

            When you reply:
            1. Cite the source URL in square brackets, e.g. [Source: https://abconvert.gitbook.io/...]. Please newline every source,like:
            [Source: https://abconvert.gitbook.io/...]
            [Source: https://abconvert.gitbook.io/...]
            2. If you cannot find an answer, say: “I’m sorry, I don’t have that information right now.”
            3. Use bullet points or numbered lists when it helps readability.
            4. Give direct steps to teach user how to build up their questions.
            Documentation snippets:"""${context}"""
        `
        },

      // —— Few-shot example #1 ——
        {
        role: 'user',
        content: `
            Documentation snippets:
            Source: https://abconvert.gitbook.io/.../pricing-tests
            ABConvert supports two pricing tests:
            - A vs B price
            - Discount-code vs no-code

            User question: What pricing tests can I run?
        `
        },
        {
        role: 'assistant',
        content: `
             **A vs B price point tests**  
                **Why run it:** To measure price sensitivity—find the sweet spot that maximizes both conversion rate and revenue per user. 
                By showing half your visitors Price A and half Price B, you learn which price drives higher overall profit.  

            **Coupon vs no-coupon tests**  
                **Why run it:** To gauge the real lift from discounts versus standard pricing. 
                Coupons can boost conversion but may erode margins—this test quantifies that trade-off so you can decide if the incremental sales justify the discount cost.    
            [Source: https://abconvert.gitbook.io/.../pricing-tests]
        `
        },

        // —— Few-shot example #2 ——
        {
            role: 'user',
            content: `Documentation snippets:
            Source: https://abconvert.gitbook.io/.../theme-tests
            You can test different page layouts:
            - Hero image on top vs bottom
            - Button color green vs blue

            User question: How do I test page design?`
        },

        {
            role: 'assistant',
            content: `
            • **Swap hero positions (top vs bottom)**  
                **Why run it:** To identify which placement immediately captures user attention and encourages scrolling. Top placement may boost visibility of the main offer, while bottom placement can reduce perceived clutter and improve mobile usability.  

            • **A/B test button colors (green vs blue)**  
                **Why run it:** Button color impacts click-through by affecting contrast, emotional response, and trust. Green often signals “go” and positivity, whereas blue conveys stability—this test quantifies which color maximizes conversions for your audience.  

            [Source: https://abconvert.gitbook.io/.../theme-tests]`
        },

        {
            role: 'user',
            content: `
            Documentation snippets:\n${context}\n\n
            
            User question: ${question}
    
            `
        },
        ];

        // 7) Ask GPT-4
        const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages
        });

        const answer = completion.choices[0].message.content.trim();

        // 8) Send back JSON
        return res.json({ answer });

    } 
    catch (err) {
        console.error('🔥 ask.js error:', err);
        return res.status(500).json({
            error: err.message || 'Internal Server Error'
        });
    }
}