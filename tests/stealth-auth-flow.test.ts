import { describe, it, expect, beforeEach } from 'vitest';
import { StealthAuthServer } from '../src/server/stealth-auth-server.js';
import { StealthAuthClient } from '../src/client/stealth-auth-client.js';
import { InMemoryStorageAdapter } from '../src/server/storage.js';
import { CognitiveRule } from '../src/types.js';

describe('StealthAuth End-to-End Enterprise Flow', () => {
  let storage: InMemoryStorageAdapter;
  let server: StealthAuthServer;
  const masterPassword = '!!!!!1g0750n17!!!!!';
  const cognitiveRule: CognitiveRule = {
    type: 'insert-at-anchor',
    anchorIndex: 5,
  };

  beforeEach(async () => {
    storage = new InMemoryStorageAdapter();
    server = new StealthAuthServer(storage, {
      maxFailedAttempts: 3,
      lockoutDurationSeconds: 60,
    });

    await server.registerUser('deniz@back2iq.com', masterPassword, cognitiveRule);
  });

  it('completes two independent logins with freshly drawn challenges', async () => {
    for (const _ of [1, 2]) {
      const challenge = await server.createChallenge('deniz@back2iq.com');
      expect(challenge.disguisedHint).toBe(`v1.${challenge.index}`);

      const transformed = StealthAuthClient.transformPassword(
        masterPassword,
        challenge.hint,
        cognitiveRule
      );
      const letter = String.fromCharCode(64 + challenge.index);
      expect(transformed).toBe(`!!!!!${letter}1g0750n17!!!!!`);

      const result = await server.verifyResponse(
        StealthAuthClient.createAuthResponse(transformed, challenge)
      );

      expect(result.success).toBe(true);
      expect(result.challengeIndex).toBe(challenge.index);
      expect(result.authToken).toBeDefined();
    }
  });

  it('prevents replay attacks on consumed challenge sessions', async () => {
    const challenge = await server.createChallenge('deniz@back2iq.com');
    const transformed = StealthAuthClient.transformPassword(masterPassword, challenge.hint, cognitiveRule);
    const responsePayload = StealthAuthClient.createAuthResponse(transformed, challenge);

    const result1 = await server.verifyResponse(responsePayload);
    expect(result1.success).toBe(true);

    // Replay attempt with same payload and session
    const replayResult = await server.verifyResponse(responsePayload);
    expect(replayResult.success).toBe(false);
    expect(replayResult.error).toBe('SESSION_EXPIRED_OR_INVALID');
  });

  it('triggers account lockout after 3 consecutive invalid attempts', async () => {
    let last;
    for (let i = 0; i < 3; i++) {
      const challenge = await server.createChallenge('deniz@back2iq.com');
      last = await server.verifyResponse(
        StealthAuthClient.createAuthResponse('WRONG_PASSWORD', challenge)
      );
      expect(last.success).toBe(false);
    }

    expect(last!.error).toBe('ACCOUNT_LOCKED');
    expect(last!.retryAfterSeconds).toBe(60);

    // A locked account keeps handing out challenges; the lock is reported on verify.
    const challenge = await server.createChallenge('deniz@back2iq.com');
    const blocked = await server.verifyResponse(
      StealthAuthClient.answerChallenge(masterPassword, challenge, cognitiveRule)
    );
    expect(blocked.error).toBe('ACCOUNT_LOCKED');
  });

  it('clears the failure count after a successful login', async () => {
    const failed = await server.createChallenge('deniz@back2iq.com');
    await server.verifyResponse(StealthAuthClient.createAuthResponse('WRONG_PASSWORD', failed));
    expect((await storage.getUser('deniz@back2iq.com'))!.failedAttempts).toBe(1);

    const challenge = await server.createChallenge('deniz@back2iq.com');
    const transformed = StealthAuthClient.transformPassword(masterPassword, challenge.hint, cognitiveRule);
    const result = await server.verifyResponse(
      StealthAuthClient.createAuthResponse(transformed, challenge)
    );

    expect(result.success).toBe(true);
    expect((await storage.getUser('deniz@back2iq.com'))!.failedAttempts).toBe(0);
  });
});
