import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEnvValue,
  evaluateSupabaseConfig,
} from '../lib/supabaseClient.js';

describe('FlatMate AI Supabase Configuration & Security Validation', () => {
  it('normalizes whitespace and matching surrounding quotes', () => {
    assert.equal(normalizeEnvValue('  https://demo.supabase.co  '), 'https://demo.supabase.co');
    assert.equal(normalizeEnvValue('"https://demo.supabase.co"'), 'https://demo.supabase.co');
    assert.equal(normalizeEnvValue("  'sb_publishable_test_123'  "), 'sb_publishable_test_123');
    assert.equal(normalizeEnvValue(undefined), '');
    assert.equal(normalizeEnvValue(null), '');
  });

  it('accepts valid Supabase Project URL with sb_publishable_ key', () => {
    const fakeKey = 'sb_publishable_unit_test_sample_key_0001';
    const result = evaluateSupabaseConfig('https://demo.supabase.co', fakeKey);

    assert.equal(result.isConfigured, true);
    assert.equal(result.secretBlocked, false);
    assert.equal(result.diagnostics.hasUrl, true);
    assert.equal(result.diagnostics.urlValid, true);
    assert.equal(result.diagnostics.hasAnonKey, true);
    assert.equal(result.diagnostics.anonKeyFormat, 'sb_publishable');
    assert.equal(result.diagnostics.anonKeyLength, fakeKey.length);
  });

  it('accepts valid legacy JWT anon key and quoted/whitespace env values', () => {
    const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.unit-test-payload.sig';
    const result = evaluateSupabaseConfig(' "https://demo.supabase.co" ', ` '${fakeJwt}' `);

    assert.equal(result.isConfigured, true);
    assert.equal(result.url, 'https://demo.supabase.co');
    assert.equal(result.anonKey, fakeJwt);
    assert.equal(result.diagnostics.anonKeyFormat, 'jwt');
  });

  it('strictly blocks sb_secret_ and service_role keys in client config', () => {
    const secretRes = evaluateSupabaseConfig(
      'https://demo.supabase.co',
      'sb_secret_forbidden_browser_key_0001'
    );
    assert.equal(secretRes.isConfigured, false);
    assert.equal(secretRes.secretBlocked, true);
    assert.equal(secretRes.diagnostics.isSecretBlocked, true);
    assert.equal(secretRes.diagnostics.anonKeyFormat, 'sb_secret_blocked');

    const serviceRoleRes = evaluateSupabaseConfig(
      'https://demo.supabase.co',
      'fake_service_role_token_value'
    );
    assert.equal(serviceRoleRes.isConfigured, false);
    assert.equal(serviceRoleRes.secretBlocked, true);
  });

  it('rejects missing, placeholder, and invalid URLs', () => {
    assert.equal(evaluateSupabaseConfig('', '').isConfigured, false);
    assert.equal(
      evaluateSupabaseConfig('https://your-project-id.supabase.co', 'your_publishable_or_anon_key')
        .isConfigured,
      false
    );
    assert.equal(
      evaluateSupabaseConfig('undefined', 'sb_publishable_unit_test_0001').isConfigured,
      false
    );
    assert.equal(
      evaluateSupabaseConfig('not-a-valid-url', 'sb_publishable_unit_test_0001').diagnostics.urlValid,
      false
    );
    assert.equal(
      evaluateSupabaseConfig('not-a-valid-url', 'sb_publishable_unit_test_0001').isConfigured,
      false
    );
  });

  it('never leaks raw URL or key material in diagnostics metadata', () => {
    const secretLikeInput = 'sb_publishable_DO_NOT_LOG_THIS_TOKEN';
    const urlInput = 'https://private-project-ref.supabase.co';
    const { diagnostics } = evaluateSupabaseConfig(urlInput, secretLikeInput);
    const serialized = JSON.stringify(diagnostics);

    assert.equal(serialized.includes('private-project-ref'), false);
    assert.equal(serialized.includes('DO_NOT_LOG_THIS_TOKEN'), false);
  });
});

