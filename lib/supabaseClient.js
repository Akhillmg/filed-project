import { createClient } from '@supabase/supabase-js';

// Static property access is required so Next.js inlines NEXT_PUBLIC_* variables at build time.
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Normalizes an environment variable value by trimming whitespace and
 * stripping accidental surrounding single or double quotes.
 */
export const normalizeEnvValue = (value) => {
  if (typeof value !== 'string') return '';
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const isPlaceholder = (val) => {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    lower.includes('your_') ||
    lower.includes('your-project-id') ||
    lower === 'undefined' ||
    lower === 'null'
  );
};

const isSecretKey = (val) => {
  if (!val) return false;
  const lower = val.toLowerCase();
  return lower.startsWith('sb_secret_') || lower.includes('service_role');
};

const isValidHttpUrl = (val) => {
  if (!val || isPlaceholder(val)) return false;
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const classifyKeyFormat = (val) => {
  if (!val) return 'missing';
  if (isSecretKey(val)) return 'sb_secret_blocked';
  if (isPlaceholder(val)) return 'placeholder';
  if (val.startsWith('sb_publishable_')) return 'sb_publishable';
  if (val.startsWith('eyJ')) return 'jwt';
  return 'other';
};

/**
 * Evaluates raw Supabase env values and produces both the normalized config
 * and safe, secret-free diagnostic metadata.
 */
export const evaluateSupabaseConfig = (rawUrl, rawKey) => {
  const url = normalizeEnvValue(rawUrl);
  const anonKey = normalizeEnvValue(rawKey);
  const urlPlaceholder = isPlaceholder(url);
  const keyPlaceholder = isPlaceholder(anonKey);
  const secretBlocked = isSecretKey(anonKey);
  const urlValid = isValidHttpUrl(url);
  const keyFormat = classifyKeyFormat(anonKey);

  const isConfigured =
    Boolean(url) &&
    Boolean(anonKey) &&
    !urlPlaceholder &&
    !keyPlaceholder &&
    !secretBlocked &&
    urlValid;

  const diagnostics = {
    hasUrl: Boolean(url),
    urlValid,
    urlLooksLikePlaceholder: Boolean(url) && urlPlaceholder,
    hasAnonKey: Boolean(anonKey),
    anonKeyFormat: keyFormat,
    anonKeyLength: anonKey.length,
    isSecretBlocked: secretBlocked,
    isConfigured,
    runtime: typeof window !== 'undefined' ? 'browser' : 'server',
  };

  return { url, anonKey, isConfigured, secretBlocked, diagnostics };
};

const evaluated = evaluateSupabaseConfig(rawSupabaseUrl, rawSupabaseAnonKey);

let clientInstance = null;

if (evaluated.secretBlocked) {
  console.error(
    '[FlatMate AI SECURITY BLOCK] A Supabase secret/service_role key was detected in NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Refusing to initialize client in browser. Replace it with your public anon / publishable key.',
    evaluated.diagnostics
  );
} else if (evaluated.isConfigured) {
  try {
    clientInstance = createClient(evaluated.url, evaluated.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    if (typeof window !== 'undefined') {
      console.info('[FlatMate AI] Supabase client initialized.', evaluated.diagnostics);
    }
  } catch (err) {
    console.error('[FlatMate AI] Error initializing Supabase client:', err?.message || err, evaluated.diagnostics);
  }
} else {
  const logFn = typeof window !== 'undefined' ? console.warn : console.info;
  logFn(
    '[FlatMate AI] Supabase credentials are missing or invalid. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set for the build environment.',
    evaluated.diagnostics
  );
}

// Client instance initialized ONLY with public anon/publishable key.
// NEVER use SUPABASE_SERVICE_ROLE_KEY or sb_secret_ here as this code executes in the browser.
export const supabase = clientInstance;
export const isSupabaseConfigured = () => Boolean(clientInstance);
export const getSupabaseDiagnostics = () => ({
  ...evaluated.diagnostics,
  clientInitialized: Boolean(clientInstance),
});
