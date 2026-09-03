import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { StealthAuthServer } from '../src/server/stealth-auth-server.js';
import { StealthAuthClient } from '../src/client/stealth-auth-client.js';
import { InMemoryStorageAdapter } from '../src/server/storage.js';
import { CognitiveRule } from '../src/types.js';

const masterPassword = '!!!!!1g0750n17!!!!!';
const rule: CognitiveRule = { type: 'insert-at-anchor', anchorIndex: 5 };

describe('Hardening: a stolen database is worthless', () => {
  it('stores only public keys - no secret an attacker could answer with', async () => {
    const storage = new InMemoryStorageAdapter();
    const server = new StealthAuthServer(storage);
    await server.registerUser('victim@corp.de', masterPassword, rule);

    const record = await storage.getUser('victim@corp.de');
    const blob = JSON.stringify(record);

    expect(blob).not.toContain(masterPassword);
    // The cognitive rule is a client-side secret; the server has no use for it.
    expect(record).not.toHaveProperty('cognitiveRule');
    expect(Object.keys(record!.publicKeyTable).length).toBe(26);
  });

  it('cannot be impersonated by anyone holding the full stored record', async () => {
    const storage = new InMemoryStorageAdapter();
    const server = new StealthAuthServer(storage);
    await server.registerUser('victim@corp.de', masterPassword, rule);

    const stolen = await storage.getUser('victim@corp.de');
    const challenge = await server.createChallenge('victim@corp.de');
    const stolenKey = stolen!.publicKeyTable[challenge.index];

    // Every answer derivable from stored material must be rejected.
    const forgeries = [
      stolenKey,
      createHmac('sha256', stolenKey).update(`${challenge.nonce}:${challenge.sessionId}`).digest('hex'),
      createHmac('sha256', stolen!.passwordSalt).update(stolenKey).digest('hex'),
    ];

    for (const responseHash of forgeries) {
      const result = await server.verifyResponse({
        sessionId: challenge.sessionId,
        responseHash,
        clientTimestamp: Date.now(),
      });
      expect(result.success).toBe(false);
    }
  });

  it('still lets the legitimate user in', async () => {
    const server = new StealthAuthServer();
    await server.registerUser('victim@corp.de', masterPassword, rule);

    const challenge = await server.createChallenge('victim@corp.de');
    const result = await server.verifyResponse(
      StealthAuthClient.answerChallenge(masterPassword, challenge, rule)
    );

    expect(result.success).toBe(true);
    expect(result.authToken).toBeDefined();
  });
});

describe('Hardening: no account enumeration', () => {
  it('returns a normal-looking challenge for an unknown user', async () => {
    const server = new StealthAuthServer();
    await server.registerUser('real@corp.de', masterPassword, rule);

    const real = await server.createChallenge('real@corp.de');
    const fake = await server.createChallenge('does-not-exist@corp.de');

    expect(fake.sessionId).toMatch(/^sess_/);
    expect(fake.nonce.length).toBe(real.nonce.length);
    expect(fake.passwordSalt!.length).toBe(real.passwordSalt!.length);
    expect(fake.index).toBeGreaterThanOrEqual(1);
    expect(fake.index).toBeLessThanOrEqual(26);
  });

  it('rejects the unknown user only at verification time', async () => {
    const server = new StealthAuthServer();
    const challenge = await server.createChallenge('does-not-exist@corp.de');
    const result = await server.verifyResponse(
      StealthAuthClient.answerChallenge(masterPassword, challenge, rule)
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_CREDENTIALS');
  });
});

describe('Usability: clear, actionable outcomes', () => {
  it('tells a locked-out user when they may retry, without leaking at challenge time', async () => {
    const server = new StealthAuthServer(undefined, {
      maxFailedAttempts: 2,
      lockoutDurationSeconds: 60,
    });
    await server.registerUser('user@corp.de', masterPassword, rule);

    let last;
    for (let i = 0; i < 2; i++) {
      const challenge = await server.createChallenge('user@corp.de');
      last = await server.verifyResponse(
        StealthAuthClient.answerChallenge('WRONG', challenge, rule)
      );
    }

    expect(last!.error).toBe('ACCOUNT_LOCKED');
    expect(last!.retryAfterSeconds).toBeGreaterThan(0);
    expect(last!.retryAfterSeconds).toBeLessThanOrEqual(60);
    expect(last!.message).toMatch(/60/);

    // A locked account still hands out a challenge rather than announcing the lock.
    const challenge = await server.createChallenge('user@corp.de');
    expect(challenge.sessionId).toMatch(/^sess_/);
  });

  it('carries a human-readable message on every failure', async () => {
    const server = new StealthAuthServer();
    await server.registerUser('user@corp.de', masterPassword, rule);

    const challenge = await server.createChallenge('user@corp.de');
    const wrong = await server.verifyResponse(
      StealthAuthClient.answerChallenge('WRONG', challenge, rule)
    );
    expect(wrong.message).toBeTruthy();

    const replayed = await server.verifyResponse(
      StealthAuthClient.answerChallenge(masterPassword, challenge, rule)
    );
    expect(replayed.error).toBe('SESSION_EXPIRED_OR_INVALID');
    expect(replayed.message).toBeTruthy();
  });
});
