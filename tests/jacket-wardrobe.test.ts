/**
 * Back2IQ DynPass x TPA - Cognitive Jacket-Wardrobe Test Suite
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { describe, it, expect } from 'vitest';
import {
  CognitiveJacketWardrobe,
  SystemImmunityEngine,
  DynPassServer,
  InMemoryStorageAdapter,
} from '../src/index.js';

describe('1. Jacket-Wardrobe Model - Lifecycle & Operations', () => {
  const nakedSecret = 'ExecutiveSecretPass456!';
  const salt = 'wardrobe-test-salt-16';
  const rule = {
    type: 'slot-placement' as const,
    slots: [2, 5] as [number, number],
    modality: 'audio' as const,
  };

  it('generates 26 wardrobe hooks without storing the naked secret', () => {
    const hooks = CognitiveJacketWardrobe.generateWardrobeHooks(nakedSecret, rule, salt);
    expect(hooks).toHaveLength(26);

    for (let i = 1; i <= 26; i++) {
      const hook = hooks.find((h) => h.hookIndex === i);
      expect(hook).toBeDefined();
      expect(hook!.publicKeyHex).toBeDefined();
      expect(hook!.publicKeyHex.length).toBeGreaterThan(32);
    }
  });

  it('executes full Anziehen (Don) -> Verifizieren -> Ausziehen (Doff) cycle', async () => {
    // 1. Initialize Wardrobe with 26 hooks
    const hooks = CognitiveJacketWardrobe.generateWardrobeHooks(nakedSecret, rule, salt);
    const wardrobe = new CognitiveJacketWardrobe(hooks);
    expect(wardrobe.hookCount).toBe(26);

    // 2. Server creates a challenge
    const server = new DynPassServer(new InMemoryStorageAdapter());
    await server.registerUser('alice@test.corp', nakedSecret, rule, salt);
    const challenge = await server.createChallenge('alice@test.corp');

    // 3. User "dons" the Jacket for this specific challenge
    const { jacket, proof } = CognitiveJacketWardrobe.donJacket(
      nakedSecret,
      challenge,
      rule,
      salt
    );

    expect(jacket.status).toBe('DONNED');
    expect(jacket.challengeIndex).toBe(challenge.index);
    expect(jacket.jacketId.startsWith('jkt_')).toBe(true);
    expect(proof.sessionId).toBe(challenge.sessionId);
    expect(proof.signatureHex).toHaveLength(128); // 64 bytes Ed25519 signature

    // 4. Wardrobe verifies the proof against the hook
    const isValid = wardrobe.verifyAtWardrobe(proof, challenge);
    expect(isValid).toBe(true);

    // 5. User "doffs" the Jacket back to the wardrobe
    const doffed = CognitiveJacketWardrobe.doffJacket(jacket);
    expect(doffed.status).toBe('IN_WARDROBE');
    expect(doffed.doffedAt).toBeGreaterThan(0);
  });

  it('rejects forged / corrupted proofs and triggers the Antifragile Immunity Engine', async () => {
    const immunity = new SystemImmunityEngine('wardrobe-immunity-salt');
    const hooks = CognitiveJacketWardrobe.generateWardrobeHooks(nakedSecret, rule, salt);
    const wardrobe = new CognitiveJacketWardrobe(hooks, immunity);

    const fakeChallenge = {
      sessionId: 'sess_test_123',
      userId: 'alice@test.corp',
      hint: '5',
      disguisedHint: 'v1.5',
      nonce: 'nonce_test_456',
      passwordSalt: salt,
      expiresAt: Date.now() + 60000,
      index: 5,
    };

    const forgedProof = {
      jacketId: 'jkt_forged_999',
      sessionId: 'sess_test_123',
      responseHash: 'corrupt',
      signatureHex: 'f'.repeat(128),
      timestamp: Date.now(),
    };

    const verified = wardrobe.verifyAtWardrobe(forgedProof, fakeChallenge);
    expect(verified).toBe(false);

    // Verified that anomaly is trapped in the immunity engine
    const stats = immunity.getStats();
    expect(stats.totalAnomaliesTrapped).toBe(1);
    expect(stats.vectorsByCategory.CRYPTO_CORRUPTION).toBe(1);
  });
});
