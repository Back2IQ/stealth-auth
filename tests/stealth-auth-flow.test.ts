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
      lookaheadWindowForward: 3,
      lookbackWindowBackward: 1,
      maxFailedAttempts: 3,
      lockoutDurationSeconds: 60,
    });

    await server.registerUser('deniz@back2iq.com', masterPassword, cognitiveRule, 0);
  });

  it('completes normal sequential logins and increments counter', async () => {
    // 1st Login (N=0, Hint="1" -> Letter 'A')
    const challenge1 = await server.createChallenge('deniz@back2iq.com');
    expect(challenge1.hint).toBe('1');
    expect(challenge1.disguisedHint).toBe('v1.1');

    const transformed1 = StealthAuthClient.transformPassword(masterPassword, challenge1.hint, cognitiveRule);
    expect(transformed1).toBe('!!!!!A1g0750n17!!!!!');

    const responsePayload1 = StealthAuthClient.createAuthResponse(transformed1, challenge1);
    const result1 = await server.verifyResponse(responsePayload1);

    expect(result1.success).toBe(true);
    expect(result1.verifiedCounter).toBe(0);
    expect(result1.resynced).toBe(false);
    expect(result1.authToken).toBeDefined();

    // 2nd Login (N=1, Hint="2" -> Letter 'B')
    const challenge2 = await server.createChallenge('deniz@back2iq.com');
    expect(challenge2.hint).toBe('2');
    expect(challenge2.disguisedHint).toBe('v1.2');

    const transformed2 = StealthAuthClient.transformPassword(masterPassword, challenge2.hint, cognitiveRule);
    const responsePayload2 = StealthAuthClient.createAuthResponse(transformed2, challenge2);
    const result2 = await server.verifyResponse(responsePayload2);

    expect(result2.success).toBe(true);
    expect(result2.verifiedCounter).toBe(1);
  });

  it('recovers automatically from forward desynchronization (Lookahead Window +2)', async () => {
    // Current server state: N=0.
    // Suppose user thinks they are on N=2 (Letter 'C', Hint="3") due to aborted attempts on another device
    const challenge = await server.createChallenge('deniz@back2iq.com'); // Server expects N=0

    // User submits answer for N=2
    const userEstimatedState = { counter: 2, cycle: 0, index: 3, letter: 'C', hint: '3' };
    const transformedPassword = StealthAuthClient.transformPassword(masterPassword, userEstimatedState, cognitiveRule);

    const responsePayload = StealthAuthClient.createAuthResponse(transformedPassword, challenge);
    const result = await server.verifyResponse(responsePayload);

    expect(result.success).toBe(true);
    expect(result.verifiedCounter).toBe(2);
    expect(result.resynced).toBe(true);
    expect(result.delta).toBe(2);

    // Verify next challenge starts at N=3
    const nextChallenge = await server.createChallenge('deniz@back2iq.com');
    expect(nextChallenge.hint).toBe('4'); // Index 4 (N=3)
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
    for (let i = 0; i < 3; i++) {
      const challenge = await server.createChallenge('deniz@back2iq.com');
      const badResponse = StealthAuthClient.createAuthResponse('WRONG_PASSWORD', challenge);
      const res = await server.verifyResponse(badResponse);
      expect(res.success).toBe(false);
    }

    // 4th attempt should be blocked due to account lockout
    await expect(server.createChallenge('deniz@back2iq.com')).rejects.toThrow(/Account locked/);
  });
});
