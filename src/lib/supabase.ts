import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const rawUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const rawKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

let validUrl = 'https://mock.supabase.co';
try {
  validUrl = new URL(rawUrl).toString();
} catch (e) {
  console.warn('Invalid Supabase URL in .env, falling back to mock URL to prevent crash.');
}

const supabaseUrl = validUrl;
const supabaseAnonKey = rawKey || 'mock-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
