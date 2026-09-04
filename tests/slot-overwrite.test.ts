/**
 * Back2IQ DynPass - In-Place Slot Overwrite Engine & 3-Zone Architecture Tests
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { describe, it, expect } from 'vitest';
import {
  applySlotOverwrite,
  applyCognitiveTransformation,
  encodeRadix26,
  DynPassServer,
  DynPassClient,
  InMemoryStorageAdapter,
  CognitiveOnboardingWizard,
  getPersonalQuestionById,
  CognitiveRule,
} from '../src/index.js';

describe('DynPass In-Place Slot Overwrite Engine ($L = const$)', () => {
  const masterPassword = 'Geheim123'; // 9 characters

  describe('1. applySlotOverwrite direct function testing', () => {
    it('Zone 1 (Prefix [1, 2]): replaces first two characters and preserves length', () => {
      // Geheim123 -> Htheim123
      const result = applySlotOverwrite(masterPassword, 'H', 't', [1, 2]);
      expect(result).toBe('Htheim123');
      expect(result.length).toBe(masterPassword.length);
    });

    it('Zone 2 (Frame [1, -1]): replaces first and last character with negative index support', () => {
      // Geheim123 -> Heheim12t (1st char replaced by H, last char replaced by t)
      const result = applySlotOverwrite(masterPassword, 'H', 't', [1, -1]);
      expect(result).toBe('Heheim12t');
      expect(result.length).toBe(masterPassword.length);
    });

    it('Zone 3 (Ending Schlussakkord [-2, -1]): replaces last two characters and preserves length', () => {
      // In 'Geheim123', characters at 1-based positions 8 and 9 are '2' and '3'
      const result = applySlotOverwrite(masterPassword, 'H', 't', [8, 9]);
      expect(result).toBe('Geheim1Ht');
      expect(result.length).toBe(masterPassword.length);

      // Negative indices [-2, -1] universally point to the last two characters
      const negResult = applySlotOverwrite(masterPassword, 'H', 't', [-2, -1]);
      expect(negResult).toBe('Geheim1Ht');
      expect(negResult.length).toBe(masterPassword.length);
    });

    it('handles inverted slot order gracefully [2, 1] vs [1, 2]', () => {
      const res1 = applySlotOverwrite(masterPassword, 'H', 't', [1, 2]);
      const res2 = applySlotOverwrite(masterPassword, 'H', 't', [2, 1]);
      // Slot 1 gets 'H', Slot 2 gets 't' regardless of order or deterministic mapping
      expect(res1).toBe('Htheim123');
      expect(res2).toBe('Htheim123');
      expect(res1.length).toBe(masterPassword.length);
      expect(res2.length).toBe(masterPassword.length);
    });

    it('handles identical slots gracefully [3, 3]', () => {
      const result = applySlotOverwrite(masterPassword, 'A', 'B', [3, 3]);
      expect(result.length).toBe(masterPassword.length);
      // char2 overwrites slot
      expect(result).toBe('GeBeim123');
    });

    it('handles edge cases: empty string, single char, out-of-bounds', () => {
      // Empty string
      expect(applySlotOverwrite('', 'A', 'B', [1, 2])).toBe('');

      // Single character
      const single = applySlotOverwrite('X', 'A', 'B', [1, 2]);
      expect(single.length).toBe(1);

      // Out of bounds slots
      const outOfBounds = applySlotOverwrite('Test', 'A', 'B', [99, 100]);
      expect(outOfBounds.length).toBe(4);
    });
  });

  describe('2. CognitiveOnboardingWizard 3-Zone Architecture', () => {
    it('calculates cognitive zones dynamically for a password with trailing digits', () => {
      const zones = CognitiveOnboardingWizard.getCognitiveZones('MySecurePass99');
      expect(zones.length).toBe(3);

      const prefixZone = zones.find((z) => z.id === 'prefix');
      expect(prefixZone).toBeDefined();
      expect(prefixZone?.slots).toEqual([1, 2]);
      expect(prefixZone?.recommended).toBe(true);

      const frameZone = zones.find((z) => z.id === 'frame');
      expect(frameZone).toBeDefined();
      expect(frameZone?.slots).toEqual([1, -1]);

      const digitsZone = zones.find((z) => z.id === 'suffix-digits');
      expect(digitsZone).toBeDefined();
      expect(digitsZone?.available).toBe(true);
      expect(digitsZone?.samplePreview).toBe('Geheim1Ht');
      // 'MySecurePass99' has length 14, digits at 13 and 14
      expect(digitsZone?.slots).toEqual([13, 14]);
    });

    it('marks suffix-digits zone as unavailable when password lacks digits', () => {
      const zones = CognitiveOnboardingWizard.getCognitiveZones('NoDigitsHere');
      const digitsZone = zones.find((z) => z.id === 'suffix-digits');
      expect(digitsZone?.available).toBe(false);
    });

    it('preset profiles default to overwrite mode and prefix zone', () => {
      const presets = CognitiveOnboardingWizard.getPresetProfiles();
      for (const preset of presets) {
        if (preset.rule.type === 'slot-placement') {
          expect(preset.rule.mode).toBe('overwrite');
          expect(preset.rule.zone).toBe('prefix');
          expect(preset.rule.slots).toEqual([1, 2]);
        }
      }
    });
  });

  describe('3. Cognitive Rule Integration with overwrite mode', () => {
    const state = encodeRadix26(5); // Index 6 -> 'F' -> 'Falcon' (F, n)

    it('transforms text modality with in-place overwrite', () => {
      const rule: CognitiveRule = {
        type: 'slot-placement',
        slots: [1, 2],
        modality: 'text',
        mode: 'overwrite',
        zone: 'prefix',
      };
      const transformed = applyCognitiveTransformation(masterPassword, state, rule);
      // Geheim123 -> Fnheim123
      expect(transformed).toBe('Fnheim123');
      expect(transformed.length).toBe(masterPassword.length);
    });

    it('transforms frame zone with in-place overwrite', () => {
      const rule: CognitiveRule = {
        type: 'slot-placement',
        slots: [1, -1],
        modality: 'text',
        mode: 'overwrite',
        zone: 'frame',
      };
      const transformed = applyCognitiveTransformation(masterPassword, state, rule);
      // Geheim123 -> Feheim12n
      expect(transformed).toBe('Feheim12n');
      expect(transformed.length).toBe(masterPassword.length);
    });

    it('transforms audio modality with in-place overwrite', () => {
      const audioState = {
        ...state,
        spokenAudioWord: 'Tiger', // T, r
      };
      const rule: CognitiveRule = {
        type: 'slot-placement',
        slots: [1, 2],
        modality: 'audio',
        mode: 'overwrite',
        zone: 'prefix',
      };
      const transformed = applyCognitiveTransformation(masterPassword, audioState, rule);
      // Geheim123 -> Trheim123
      expect(transformed).toBe('Trheim123');
      expect(transformed.length).toBe(masterPassword.length);
    });

    it('transforms personal questions modality with in-place overwrite', () => {
      const question = getPersonalQuestionById('pq_first_pet')!; // Bello -> B, o
      const qState = {
        ...state,
        questionHint: question,
      };
      const rule: CognitiveRule = {
        type: 'slot-placement',
        slots: [1, 2],
        modality: 'personal-questions',
        locale: 'de',
        mode: 'overwrite',
        zone: 'prefix',
      };
      const transformed = applyCognitiveTransformation(masterPassword, qState, rule);
      // Geheim123 -> Boheim123
      expect(transformed).toBe('Boheim123');
      expect(transformed.length).toBe(masterPassword.length);
    });
  });

  describe('4. End-to-End Server and Client Verification with Overwrite Engine', () => {
    it('successfully registers and authenticates a user using slot overwrite', async () => {
      const server = new DynPassServer(new InMemoryStorageAdapter());

      const username = 'deniz_kiran_overwrite';
      const rule: CognitiveRule = {
        type: 'slot-placement',
        slots: [1, 2],
        modality: 'text',
        mode: 'overwrite',
        zone: 'prefix',
      };

      // 1. Register User on Server
      await server.registerUser(username, masterPassword, rule);

      // 2. Server generates authentication challenge
      const challenge = await server.createChallenge(username);
      expect(challenge.sessionId).toBeDefined();
      expect(challenge.disguisedHint).toBeDefined();

      // 3. Client responds using in-place overwrite transformation
      const response = DynPassClient.answerChallenge(
        masterPassword,
        challenge,
        rule
      );

      // 4. Server verifies the response
      const verifyResult = await server.verifyResponse(response);

      expect(verifyResult.success).toBe(true);
      expect(verifyResult.authToken).toBeDefined();
    });

    it('rejects authentication if wrong transformation mode or wrong password is used', async () => {
      const server = new DynPassServer(new InMemoryStorageAdapter());

      const username = 'deniz_test_tamper';
      const overwriteRule: CognitiveRule = {
        type: 'slot-placement',
        slots: [1, 2],
        modality: 'text',
        mode: 'overwrite',
        zone: 'prefix',
      };

      await server.registerUser(username, masterPassword, overwriteRule);

      const challenge = await server.createChallenge(username);

      // Client accidentally uses 'insert' mode rule instead of 'overwrite'
      const insertRule: CognitiveRule = {
        type: 'slot-placement',
        slots: [1, 2],
        modality: 'text',
        mode: 'insert',
      };

      const response = DynPassClient.answerChallenge(
        masterPassword,
        challenge,
        insertRule
      );

      const verifyResult = await server.verifyResponse(response);
      expect(verifyResult.success).toBe(false);
    });
  });
});
