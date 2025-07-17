// api/feedback.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { question, accuracy, helpfulness } = req.body;
  if (!question || !accuracy || !helpfulness) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const { error } = await supabase
    .from('feedback')
    .insert({ question_text: question, accuracy, helpfulness });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
}
