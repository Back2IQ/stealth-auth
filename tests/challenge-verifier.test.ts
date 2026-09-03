import { describe, it, expect } from 'vitest';
import { StealthAuthServer } from '../src/server/stealth-auth-server.js';
import { StealthAuthClient } from '../src/client/stealth-auth-client.js';
import { InMemoryStorageAdapter } from '../src/server/storage.js';
import { derivePublicKey } from '../src/crypto/keys.js';
import { CognitiveRule } from '../src/types.js';

const masterPassword = '!!!!!1g0750n17!!!!!';
const rule: CognitiveRule = { type: 'insert-at-anchor', anchorIndex: 5 };

async function loginOnce(server: StealthAuthServer, userId: string) {
  const challenge = await server.createChallenge(userId);
  const transformed = StealthAuthClient.transformPassword(masterPassword, challenge.hint, rule);
  const payload = StealthAuthClient.createAuthResponse(transformed, challenge);
  return { challenge, result: await server.verifyResponse(payload) };
}

describe('Random-Challenge Public Key Table', () => {
  it('derives one deterministic public key per transformed password and salt', () => {
    const salt = 'a'.repeat(32);
    const key = derivePublicKey(salt, 'transformed-secret');

    // Ed25519 SPKI in DER is 44 bytes = 88 hex chars.
    expect(key.length).toBe(88);
    expect(derivePublicKey(salt, 'transformed-secret')).toBe(key);
    expect(derivePublicKey(salt, 'other-secret')).not.toBe(key);
    expect(derivePublicKey('b'.repeat(32), 'transformed-secret')).not.toBe(key);
  });

  it('stores exactly 26 public keys keyed 1..26 and no plaintext password', async () => {
    const storage = new InMemoryStorageAdapter();
    const server = new StealthAuthServer(storage);
    await server.registerUser('user@corp.de', masterPassword, rule);

    const record = await storage.getUser('user@corp.de');
    const keys = Object.keys(record!.publicKeyTable).map(Number).sort((a, b) => a - b);

    expect(keys.length).toBe(26);
    expect(keys[0]).toBe(1);
    expect(keys[25]).toBe(26);
    expect(JSON.stringify(record)).not.toContain(masterPassword);
    expect(record).not.toHaveProperty('counter');
  });

  it('draws an unpredictable challenge inside 1..26 on every call', async () => {
    const server = new StealthAuthServer();
    await server.registerUser('user@corp.de', masterPassword, rule);

    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const challenge = await server.createChallenge('user@corp.de');
      expect(challenge.index).toBeGreaterThanOrEqual(1);
      expect(challenge.index).toBeLessThanOrEqual(26);
      expect(challenge.hint).toBe(String(challenge.index));
      seen.add(challenge.index);
    }

    // A sequential counter would return the same index 40 times over; a draw does not.
    expect(seen.size).toBeGreaterThan(1);
  });

  it('authenticates against whichever challenge the server drew', async () => {
    const server = new StealthAuthServer();
    await server.registerUser('user@corp.de', masterPassword, rule);

    const { challenge, result } = await loginOnce(server, 'user@corp.de');
    expect(result.success).toBe(true);
    expect(result.challengeIndex).toBe(challenge.index);
    expect(result.authToken).toBeDefined();
  });

  it('never exhausts: the stored state does not grow or advance across 60 logins', async () => {
    const storage = new InMemoryStorageAdapter();
    const server = new StealthAuthServer(storage);
    await server.registerUser('longterm@corp.de', masterPassword, rule);

    for (let i = 0; i < 60; i++) {
      const { result } = await loginOnce(server, 'longterm@corp.de');
      expect(result.success).toBe(true);
    }

    // No per-login counter means no finite table to run off the end of.
    const record = await storage.getUser('longterm@corp.de');
    expect(Object.keys(record!.publicKeyTable).length).toBe(26);
    expect(record).not.toHaveProperty('counter');
  });

  it('accepts a client-precomputed table so the server never sees the password', async () => {
    const storage = new InMemoryStorageAdapter();
    const server = new StealthAuthServer(storage);
    const salt = 'b'.repeat(32);

    const table = StealthAuthClient.generatePublicKeyTable(masterPassword, rule, salt);
    expect(Object.keys(table).length).toBe(26);

    await server.registerUser('zk@corp.de', table, rule, salt);
    const { result } = await loginOnce(server, 'zk@corp.de');
    expect(result.success).toBe(true);
  });

  it('rejects a wrong response and reports no counter state', async () => {
    const server = new StealthAuthServer();
    await server.registerUser('user@corp.de', masterPassword, rule);

    const challenge = await server.createChallenge('user@corp.de');
    const bad = StealthAuthClient.createAuthResponse('WRONG_PASSWORD', challenge);
    const result = await server.verifyResponse(bad);

    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_CREDENTIALS');
    expect(result).not.toHaveProperty('resynced');
    expect(result).not.toHaveProperty('delta');
  });
});
