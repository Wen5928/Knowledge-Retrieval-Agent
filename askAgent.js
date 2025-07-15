// askAgentCli.js
import dotenv from 'dotenv';
import promptSync from 'prompt-sync';
import OpenAI from 'openai';
import { supabase } from './supabaseClient.js';
import { getEmbedding } from './embedding.js';

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
        content:
          "You are ABConvert’s expert assistant. Use the provided documentation snippets to answer the user’s question accurately. Cite the source URL when possible.",
      },
      {
        role: 'user',
        content: `Documentation snippets:\n${context}\n\nUser question: ${question}`,
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
