import { createClient } from '@supabase/supabase-js';

export function createServerSupabase() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;
  return createClient(url, key);
}

export function getImageUrl(supabaseUrl: string, storagePath: string): string {
  if (storagePath.startsWith('http')) return storagePath;
  return `${supabaseUrl}/storage/v1/object/public/product-images/${storagePath}`;
}
