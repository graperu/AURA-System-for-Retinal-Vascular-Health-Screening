import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const resolveEnv = (keys: string[]): string => {
  for (const k of keys) {
    const metaVal = (import.meta.env as Record<string, any>)?.[k];
    if (metaVal && typeof metaVal === 'string' && metaVal.trim() !== '' && !metaVal.includes('YOUR_')) {
      return metaVal.trim();
    }
    try {
      if (typeof process !== 'undefined' && process.env) {
        const procVal = (process.env as Record<string, string>)[k];
        if (procVal && typeof procVal === 'string' && procVal.trim() !== '' && !procVal.includes('YOUR_')) {
          return procVal.trim();
        }
      }
    } catch (_) {}
  }
  return '';
};

const DEFAULT_SUPABASE_URL = 'https://ovvtqzpsbdgrtgdsrtrq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dnRxenBzYmRncnRnZHNydHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Mzg0NjksImV4cCI6MjEwNTIxNDQ2OX0.ZVdmetDMT7hN6Qi80saAvWn-vCgB4vuB-NkqBUS9Djg';

export const supabaseUrl = resolveEnv(['VITE_SUPABASE_URL', 'SUPABASE_URL']) || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey =
  resolveEnv(['VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY']) || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20);
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

export const supabase = getSupabaseClient();

/**
 * Upload a fundus scan image to Supabase Storage bucket 'fundus-scans'
 */
export const uploadFundusScan = async (file: File | Blob, fileName?: string): Promise<{ path: string; publicUrl: string } | null> => {
  try {
    const client = getSupabaseClient();
    const name = fileName || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
    const bucket = 'fundus-scans';

    const { data, error } = await client.storage.from(bucket).upload(name, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.warn('[Supabase Storage] Upload notice:', error.message);
      return null;
    }

    const { data: publicData } = client.storage.from(bucket).getPublicUrl(data.path);
    return {
      path: data.path,
      publicUrl: publicData.publicUrl,
    };
  } catch (err) {
    console.warn('[Supabase Storage] Exception uploading fundus scan:', err);
    return null;
  }
};
