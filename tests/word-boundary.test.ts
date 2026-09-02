import { describe, it, expect } from 'vitest';
import { encodeRadix26 } from '../src/core/radix26.js';
import { applyCognitiveTransformation } from '../src/core/cognitive.js';
import { StealthAuthServer } from '../src/server/stealth-auth-server.js';
import { StealthAuthClient } from '../src/client/stealth-auth-client.js';
import { InMemoryStorageAdapter } from '../src/server/storage.js';
import { CognitiveRule } from '../src/types.js';

describe('Word-Boundary 0-Counting Cognitive Mode', () => {
  const masterPassword = '!!!!!1g0750n17!!!!!';

  it('instantly transforms password using first & last chars of word (as-is case)', () => {
    // Counter 5 -> Index 6 -> Word "Falcon" (first: 'F', last: 'n')
    const state = encodeRadix26(5);
    expect(state.wordHint).toBe('Falcon');

    const rule: CognitiveRule = {
      type: 'word-boundary',
      caseMode: 'as-is',
    };

    const transformed = applyCognitiveTransformation(masterPassword, state, rule);
    // 'F' + "!!!!!1g0750n17!!!!!" + 'n'
    expect(transformed).toBe('F!!!!!1g0750n17!!!!!n');
  });

  it('supports upper-case and lower-case normalization', () => {
    const state = encodeRadix26(5); // Word "Falcon"

    const upperRule: CognitiveRule = {
      type: 'word-boundary',
      caseMode: 'upper',
    };
    expect(applyCognitiveTransformation(masterPassword, state, upperRule)).toBe('F!!!!!1g0750n17!!!!!N');

    const lowerRule: CognitiveRule = {
      type: 'word-boundary',
      caseMode: 'lower',
    };
    expect(applyCognitiveTransformation(masterPassword, state, lowerRule)).toBe('f!!!!!1g0750n17!!!!!n');
  });

  it('executes full end-to-end word-boundary login with codename disguise', async () => {
    const storage = new InMemoryStorageAdapter();
    const server = new StealthAuthServer(storage);

    const rule: CognitiveRule = {
      type: 'word-boundary',
      caseMode: 'as-is',
    };

    await server.registerUser('pilot@stealth2iq.com', masterPassword, rule, 5); // Starts at Falcon

    // 1. Server generates challenge with codename disguise
    const challenge = await server.createChallenge('pilot@stealth2iq.com', {
      mode: 'codename-word',
    });

    expect(challenge.disguisedHint).toBe('Codename: Falcon');
    expect(challenge.wordHint).toBe('Falcon');

    // 2. User sees "Codename: Falcon", types: 'F' + master + 'n'
    const transformed = StealthAuthClient.transformPassword(
      masterPassword,
      challenge.hint,
      rule
    );
    expect(transformed).toBe('F!!!!!1g0750n17!!!!!n');

    // 3. Submit and verify
    const authPayload = StealthAuthClient.createAuthResponse(transformed, challenge);
    const result = await server.verifyResponse(authPayload);

    expect(result.success).toBe(true);
    expect(result.verifiedCounter).toBe(5);
  });
});
