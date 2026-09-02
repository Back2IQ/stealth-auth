import { describe, it, expect } from 'vitest';
import {
  generateSecureNonce,
  generateSessionId,
  computeHmacSha256,
  computeClientResponseHash,
  constantTimeCompare,
  signPayload,
  verifyPayloadSignature,
} from '../src/crypto/hasher.js';

describe('Cryptographic Primitives & Security', () => {
  it('generates unique random nonces and session IDs', () => {
    const nonce1 = generateSecureNonce();
    const nonce2 = generateSecureNonce();
    expect(nonce1).not.toBe(nonce2);
    expect(nonce1.length).toBe(64); // 32 bytes = 64 hex chars

    const sess1 = generateSessionId();
    expect(sess1.startsWith('sess_')).toBe(true);
  });

  it('computes deterministic HMAC-SHA256 hashes', () => {
    const hash1 = computeHmacSha256('secret-key', 'sample-data');
    const hash2 = computeHmacSha256('secret-key', 'sample-data');
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('performs constant-time string comparison', () => {
    const valid = 'a'.repeat(64);
    const validClone = 'a'.repeat(64);
    const invalid = 'b'.repeat(64);

    expect(constantTimeCompare(valid, validClone)).toBe(true);
    expect(constantTimeCompare(valid, invalid)).toBe(false);
    expect(constantTimeCompare(valid, 'short')).toBe(false);
  });

  it('computes client response hash with session binding', () => {
    const res1 = computeClientResponseHash('password123', 'nonceA', 'sess_1');
    const res2 = computeClientResponseHash('password123', 'nonceB', 'sess_1');
    expect(res1).not.toBe(res2);
  });

  it('signs and verifies payload tamper-proof signatures', () => {
    const secret = 'master-anti-tamper-key';
    const payload = { userId: 'usr_1', counter: 42, tier: 'ENTERPRISE' };
    const sig = signPayload(secret, payload);

    expect(verifyPayloadSignature(secret, payload, sig)).toBe(true);

    const tampered = { ...payload, tier: 'FREE' };
    expect(verifyPayloadSignature(secret, tampered, sig)).toBe(false);
  });
});
