import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isPlaceholder = (val) =>
  !val ||
  val.includes('your_') ||
  val.includes('your-project-id') ||
  val === 'undefined';

const isSecretKey = (val) =>
  Boolean(val) && (val.startsWith('sb_secret_') || val.toLowerCase().includes('service_role'));

const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !isPlaceholder(supabaseUrl) &&
  !isPlaceholder(supabaseAnonKey) &&
  !isSecretKey(supabaseAnonKey) &&
  supabaseUrl.startsWith('http');

let clientInstance = null;

if (isSecretKey(supabaseAnonKey)) {
  console.error(
    '[FlatMate AI SECURITY BLOCK] A Supabase secret/service_role key was detected in NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Refusing to initialize client in browser. Replace it with your public anon / publishable key.'
  );
} else if (isConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('[FlatMate AI] Error initializing Supabase client:', err);
  }
} else if (typeof window !== 'undefined') {
  console.warn(
    '[FlatMate AI] Supabase credentials are not configured yet in .env.local. ' +
    'Please add your valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Client instance initialized ONLY with public anon/publishable key.
// NEVER use SUPABASE_SERVICE_ROLE_KEY or sb_secret_ here as this code executes in the browser.
export const supabase = clientInstance;
export const isSupabaseConfigured = () => Boolean(clientInstance);
