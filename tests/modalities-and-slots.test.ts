/**
 * Back2IQ DynPass - Modalities, Slot-Placement & Biographic Questions Test Suite
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { describe, it, expect } from 'vitest';
import {
  applySlotTransformation,
  applyCognitiveTransformation,
  encodeRadix26,
  DynPassServer,
  DynPassClient,
  InMemoryStorageAdapter,
  PERSONAL_QUESTIONS_POOL,
  getPersonalQuestionForIndex,
  getPersonalQuestionById,
  CognitiveOnboardingWizard,
} from '../src/index.js';

describe('1. Pure Slot-Placement Transformation', () => {
  it('correctly inserts characters at slots [2, 5] on 12345qwert', () => {
    const base = '12345qwert';
    const result = applySlotTransformation(base, 'H', 't', [2, 5]);
    expect(result).toBe('1H234t5qwert');
  });

  it('correctly inserts characters at slots [2, 5] on 1234qwert', () => {
    const base = '1234qwert';
    const result = applySlotTransformation(base, 'H', 't', [2, 5]);
    expect(result).toBe('1H234tqwert');
  });

  it('handles edge slot indices gracefully ([1, 2] at start)', () => {
    const base = 'Secret123';
    const result = applySlotTransformation(base, 'A', 'B', [1, 2]);
    expect(result).toBe('ASBecret123');
  });

  it('handles inverted slot order ([5, 2] equivalent to [2, 5])', () => {
    const base = 'AlphaBeta';
    const res1 = applySlotTransformation(base, 'X', 'Y', [2, 5]);
    const res2 = applySlotTransformation(base, 'X', 'Y', [5, 2]);
    expect(res1).toBe(res2);
  });
});

describe('2. The 4 Security Modalities & Cognitive Rules', () => {
  const base = '12345qwert';
  const state = encodeRadix26(5); // Index 6 -> 'F' -> 'Falcon'

  it('Modalitaet 1 (Text / Codename): inserts boundaries at slots [2, 5]', () => {
    const rule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'text' as const,
    };
    const transformed = applyCognitiveTransformation(base, state, rule);
    expect(transformed).toBe('1F234n5qwert');
  });

  it('Modalitaet 2 (Image / Pictorial Object): inserts object boundary at slots [2, 5]', () => {
    const rule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'image' as const,
      locale: 'de' as const,
    };
    const transformed = applyCognitiveTransformation(base, state, rule);
    expect(transformed.length).toBe(base.length + 2);
    expect(transformed.startsWith('1')).toBe(true);
  });

  it('Modalitaet 3 (Audio / Spoken Word): uses spoken audio word boundaries', () => {
    const audioState = {
      ...state,
      spokenAudioWord: 'Tiger',
    };
    const rule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'audio' as const,
    };
    const transformed = applyCognitiveTransformation(base, audioState, rule);
    expect(transformed).toBe('1T234r5qwert');
  });

  it('Modalitaet 4 (Personal Questions): uses biographical question answer boundaries', () => {
    const question = getPersonalQuestionById('pq_first_pet')!;
    const qState = {
      ...state,
      questionHint: question,
    };
    const rule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'personal-questions' as const,
      locale: 'de' as const,
    };
    const transformed = applyCognitiveTransformation(base, qState, rule);
    expect(transformed).toBe('1B234o5qwert');
  });
});

describe('3. Biographical Questions Pool Integrity', () => {
  it('contains at least 18 unique questions', () => {
    expect(PERSONAL_QUESTIONS_POOL.length).toBeGreaterThanOrEqual(18);
  });

  it('all questions have 5-language localization (de, en, tr, fr, es)', () => {
    for (const item of PERSONAL_QUESTIONS_POOL) {
      expect(item.question.de).toBeDefined();
      expect(item.question.en).toBeDefined();
      expect(item.question.tr).toBeDefined();
      expect(item.question.fr).toBeDefined();
      expect(item.question.es).toBeDefined();

      expect(item.exampleAnswer.de).toBeDefined();
      expect(item.exampleAnswer.en).toBeDefined();
      expect(item.exampleAnswer.tr).toBeDefined();
      expect(item.exampleAnswer.fr).toBeDefined();
      expect(item.exampleAnswer.es).toBeDefined();
    }
  });

  it('deterministically maps 1..26 indices to questions', () => {
    const q1 = getPersonalQuestionForIndex(1);
    const q2 = getPersonalQuestionForIndex(2);
    const q27 = getPersonalQuestionForIndex(1);
    expect(q1).toBeDefined();
    expect(q2).toBeDefined();
    expect(q1.id).toBe(q27.id);
  });
});

describe('4. Full Server Registration, Challenge & Verification Flow with Slots', () => {
  it('completes end-to-end auth with slot-placement and countersign', async () => {
    const server = new DynPassServer(new InMemoryStorageAdapter());
    const masterPassword = 'MySecretPassword123';
    const rule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'audio' as const,
      countersign: 'Blaue Tür',
    };

    // 1. Register User
    await server.registerUser('alice@test.corp', masterPassword, rule);

    // 2. Request Challenge
    const challenge = await server.createChallenge('alice@test.corp');
    expect(challenge.countersign).toBe('Blaue Tür');
    expect(challenge.modality).toBe('audio');
    expect(challenge.index).toBeGreaterThanOrEqual(1);
    expect(challenge.index).toBeLessThanOrEqual(26);

    // 3. Client derives transformed password & signs challenge
    const clientState = encodeRadix26(challenge.index - 1);
    const transformed = applyCognitiveTransformation(masterPassword, clientState, rule);

    const response = DynPassClient.createAuthResponse(
      transformed,
      challenge
    );

    // 4. Server verifies response
    const result = await server.verifyResponse(response);
    expect(result.success).toBe(true);
    expect(result.userId).toBe('alice@test.corp');
    expect(result.authToken).toBeDefined();
  });
});

describe('5. Onboarding Wizard with 4 Modality Presets', () => {
  it('provides the 4 modality presets', () => {
    const presets = CognitiveOnboardingWizard.getPresetProfiles();
    expect(presets.length).toBe(4);
    const ids = presets.map((p) => p.id);
    expect(ids).toContain('slot-placement-audio');
    expect(ids).toContain('slot-placement-questions');
    expect(ids).toContain('slot-placement-text');
    expect(ids).toContain('slot-placement-image');
  });

  it('validates training attempts case-insensitively by default', () => {
    const session = CognitiveOnboardingWizard.generateTrainingSession('12345qwert', {
      type: 'slot-placement',
      slots: [2, 5],
      modality: 'text',
    });
    const round1 = session[0];

    // Correct input
    expect(CognitiveOnboardingWizard.verifyTrainingAttempt(round1.expectedTransformedPassword, round1)).toBe(true);

    // Case variation (e.g. lowercase) should pass when caseSensitive is false
    expect(CognitiveOnboardingWizard.verifyTrainingAttempt(round1.expectedTransformedPassword.toLowerCase(), round1, false)).toBe(true);

    // Wrong input should fail
    expect(CognitiveOnboardingWizard.verifyTrainingAttempt('completelyWrongPass', round1)).toBe(false);
  });
});
