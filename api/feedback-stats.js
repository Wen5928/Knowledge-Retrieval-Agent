// api/feedback-stats.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(_, res) {
  // Using the RPC we created
  const { data, error } = await supabase.rpc('feedback_stats');
  if (error) return res.status(500).json({ error: error.message });
  // data is an array of one row
  res.json(data[0] || { avg_accuracy: 0, avg_helpfulness: 0, total_responses: 0 });
}
