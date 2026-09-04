/**
 * Back2IQ DynPass - Dynamic Slot-Shift & Anti-Differential Cryptanalysis Test Suite
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { describe, it, expect } from 'vitest';
import {
  computeDynamicSlotShift,
  applyCognitiveTransformation,
  encodeRadix26,
  DynPassServer,
  DynPassClient,
  InMemoryStorageAdapter,
  CognitiveJacketWardrobe,
} from '../src/index.js';

describe('1. Dynamic Slot-Shift Arithmetics', () => {
  const baseSlots: [number, number] = [2, 5];
  const passwordLength = 10;

  it('determines deterministic shifted slots for consecutive challenges', () => {
    const s1 = computeDynamicSlotShift(baseSlots, 1, passwordLength);
    const s2 = computeDynamicSlotShift(baseSlots, 2, passwordLength);
    const s3 = computeDynamicSlotShift(baseSlots, 3, passwordLength);

    expect(s1).toEqual([2, 5]);
    expect(s2).toEqual([3, 6]);
    expect(s3).toEqual([4, 7]);
  });

  it('wraps around password length without collisions', () => {
    for (let index = 1; index <= 26; index++) {
      const [slot1, slot2] = computeDynamicSlotShift(baseSlots, index, passwordLength);
      expect(slot1).toBeGreaterThanOrEqual(1);
      expect(slot1).toBeLessThanOrEqual(passwordLength);
      expect(slot2).toBeGreaterThanOrEqual(1);
      expect(slot2).toBeLessThanOrEqual(passwordLength);
      expect(slot1).not.toBe(slot2);
    }
  });
});

describe('2. Anti-Differential Cryptanalysis (Keylogger Diff Defeat)', () => {
  const masterPassword = '12345qwert'; // length 10

  it('static slots produce identical insertion positions across different challenges', () => {
    const stateA = encodeRadix26(0); // Index 1 ('A' -> word: 'Alpha')
    const stateB = encodeRadix26(1); // Index 2 ('B' -> word: 'Bravo')

    const staticRule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'text' as const,
      dynamicShift: false,
    };

    const resA = applyCognitiveTransformation(masterPassword, stateA, staticRule);
    const resB = applyCognitiveTransformation(masterPassword, stateB, staticRule);

    // In static mode, character 1 is always at index 1 (slot 2-1)
    // resA[1] is 'A', resB[1] is 'B'. Position is predictable!
    expect(resA[1]).toBe('A');
    expect(resB[1]).toBe('B');
  });

  it('dynamicShift moves the insertion coordinates per challenge', () => {
    const stateA = encodeRadix26(0); // Index 1
    const stateB = encodeRadix26(1); // Index 2

    const dynamicRule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'text' as const,
      dynamicShift: true,
    };

    const resA = applyCognitiveTransformation(masterPassword, stateA, dynamicRule);
    const resB = applyCognitiveTransformation(masterPassword, stateB, dynamicRule);

    // Under dynamicShift, resA uses slots [2, 5], but resB uses slots [3, 6]!
    expect(resA).not.toEqual(resB);
    // At position 1, resA has inserted char, but resB retains original base char '2'
    expect(resA[1]).toBe('A');
    expect(resB[1]).toBe('2'); // Original character remains untouched at this slot!
    expect(resB[2]).toBe('B'); // Inserted character has shifted to position 2!
  });
});

describe('3. Full Server Registration, Challenge & Verification with Dynamic Slot-Shift', () => {
  it('authenticates seamlessly with dynamic slot-shift enabled', async () => {
    const server = new DynPassServer(new InMemoryStorageAdapter());
    const rule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'text' as const,
      dynamicShift: true,
      countersign: 'Goldener Schlüssel',
    };
    const password = 'ZeroDeviceSecurePassword77';

    // 1. Register User
    await server.registerUser('sovereign@back2iq.com', password, rule);

    // 2. Create Challenge
    const challenge = await server.createChallenge('sovereign@back2iq.com');
    expect(challenge.countersign).toBe('Goldener Schlüssel');

    // 3. Client answers challenge with dynamic shift
    const response = DynPassClient.answerChallenge(password, challenge, rule);

    // 4. Server verifies
    const result = await server.verifyResponse(response);
    expect(result.success).toBe(true);
    expect(result.userId).toBe('sovereign@back2iq.com');
    expect(result.authToken).toBeDefined();
  });

  it('works seamlessly within CognitiveJacketWardrobe', () => {
    const salt = 'wardrobe-dynshift-salt';
    const rule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'image' as const,
      dynamicShift: true,
    };
    const password = 'SovereignPassword99!';

    const hooks = CognitiveJacketWardrobe.generateWardrobeHooks(password, rule, salt);
    const wardrobe = new CognitiveJacketWardrobe(hooks);

    const fakeChallenge = {
      sessionId: 'sess_shift_123',
      userId: 'sovereign@back2iq.com',
      hint: '4',
      disguisedHint: 'v1.4',
      nonce: 'nonce_shift_456',
      passwordSalt: salt,
      expiresAt: Date.now() + 60000,
      index: 4,
    };

    const { jacket, proof } = CognitiveJacketWardrobe.donJacket(password, fakeChallenge, rule, salt);
    expect(jacket.status).toBe('DONNED');

    const verified = wardrobe.verifyAtWardrobe(proof, fakeChallenge);
    expect(verified).toBe(true);

    const doffed = CognitiveJacketWardrobe.doffJacket(jacket);
    expect(doffed.status).toBe('IN_WARDROBE');
  });
});
