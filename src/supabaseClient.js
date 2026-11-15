import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://pphphvjhwfudeunipcqm.supabase.co';
const supabasePublishableKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ANC-YmcjrtcsfwBaaRTJ-w_feaQslah';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY && 
  !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_ACTUAL') && 
  !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_supabase')
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : '';

// Public / Authenticated client creator (for request-scoped user JWT)
export const createScopedClient = (accessToken) => {
  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Admin client for backend server jobs (bypasses RLS only when explicitly required)
export const getAdminClient = () => {
  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured. Falling back to publishable key.');
    return createClient(supabaseUrl, supabasePublishableKey);
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
