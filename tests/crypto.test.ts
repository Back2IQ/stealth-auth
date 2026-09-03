import { describe, it, expect } from 'vitest';
import {
  generateSecureNonce,
  generateSessionId,
  computeHmacSha256,
  drawRandomInt,
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

  it('draws integers across the whole inclusive range', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const value = drawRandomInt(1, 26);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(26);
      seen.add(value);
    }
    expect(seen.size).toBe(26);
  });
});
