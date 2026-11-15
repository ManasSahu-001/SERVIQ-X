import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { logger } from './logger.js';

let supabaseAdminClient: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.debug('Initialized Supabase Admin Client');
  }
  return supabaseAdminClient;
};

export const getSupabaseUserClient = (jwtToken: string): SupabaseClient => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(env.SUPABASE_URL) &&
    !env.SUPABASE_URL.includes('mock-supabase') &&
    Boolean(env.SUPABASE_SECRET_KEY) &&
    !env.SUPABASE_SECRET_KEY.includes('mock-secret')
  );
};
