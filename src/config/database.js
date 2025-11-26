const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


const envUrl = process.env.SUPABASE_URL;
const envKey = process.env.SUPABASE_ANON_KEY;
const viteUrl = process.env.VITE_SUPABASE_URL;
const viteKey = process.env.VITE_SUPABASE_ANON_KEY;

const looksLikeUrl = (u) => typeof u === 'string' && /^https?:\/\//.test(u);

const supabaseUrl = looksLikeUrl(envUrl) ? envUrl : (looksLikeUrl(viteUrl) ? viteUrl : null);
const supabaseKey = (envKey && !envKey.startsWith('your_')) ? envKey : (viteKey || null);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing or invalid Supabase environment variables. Set SUPABASE_URL and SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
