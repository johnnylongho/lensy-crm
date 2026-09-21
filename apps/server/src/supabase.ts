import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your-anon-key')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[Supabase] Connected to live Supabase project:', supabaseUrl);
} else {
  console.log('[Supabase] Running in local PoC Mock Store mode (Set SUPABASE_URL & SUPABASE_ANON_KEY in .env to connect to live Supabase).');
}
