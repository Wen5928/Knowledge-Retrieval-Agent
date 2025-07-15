// askAgent.js
import dotenv from 'dotenv';
import promptSync from 'prompt-sync';
import OpenAI from 'openai';
import { supabase } from './lib/supabaseClient.js';
import { getEmbedding } from './lib/embedding.js';

import cors from 'cors';
// Allow any origin (including chrome-extension://…)
app.use(cors({
  origin: true,
  credentials: true
}));

dotenv.config();
const prompt = promptSync({ sigint: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });




async function main() {
  console.log('\n🟢 ABConvert Knowledge CLI\n');
  const question = prompt('❓ Enter your question: ');
  if (!question.trim()) {
    console.log('No question provided. Exiting.');
    process.exit(0);
  }

  try {
    // 1. Embed the user question
    const queryEmbedding = await getEmbedding(question);

    // 2. Retrieve top 5 matching docs from Supabase
    const { data: docs, error: rpcError } = await supabase.rpc(
      'match_documents',
      {
        match_count: 5,
        match_threshold: 0.2,
        query_embedding: queryEmbedding,
      }
    );
    
    if (rpcError) throw rpcError;

    if (!docs || docs.length === 0) {
      console.log("\n⚠️  No relevant documentation found.");
      process.exit(0);
    }

    // 3. Build context string with source URLs
    const context = docs
      .map((d) => `Source: ${d.source}\n${d.content}`)
      .join('\n\n---\n\n');

    // 4. Ask GPT-4 with system + user messages
    const messages = [
      {
        role: 'system',
        content:`
          You are ABConvert’s expert assistant.
          Use the provided documentation snippets to answer the user’s question accurately and concisely.\n

          When you reply:
          1. Cite the source URL in square brackets, e.g. [Source: https://abconvert.gitbook.io/...]
          2. If you cannot find an answer, say: “I’m sorry, I don’t have that information right now.”
          3. Use bullet points or numbered lists when it helps readability.
          4. Give direct steps to teach user how to build up their questions
          Documentation snippets:"""${context}"""
          `
      },

      // —— Few-shot example #1 ——
  {
    role: 'user',
    content: `Documentation snippets:
      Source: https://abconvert.gitbook.io/.../pricing-tests
      ABConvert supports two pricing tests:
      - A vs B price
      - Discount-code vs no-code

      User question: What pricing tests can I run?`
        },
        {
          role: 'assistant',
          content: `• A vs B price point tests  
      • Coupon vs no-coupon tests  
      [Source: https://abconvert.gitbook.io/.../pricing-tests]`
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
          content: `• Swap hero positions (top vs bottom)  
      • A/B test button colors (green vs blue)  
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    });

    const answer = completion.choices[0].message.content.trim();
    console.log('\n🤖 AI’s Answer:\n');
    console.log(answer, '\n');
  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }

  process.exit(0);
}

main();
