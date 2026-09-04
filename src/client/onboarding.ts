/**
 * Back2IQ StealthAuth - Interactive Client Onboarding & Cognitive Wizard
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 * 
 * Provides an interactive onboarding workflow where users configure
 * their personal cognitive profile, select disguises/languages, and complete
 * verified dry-run training logins before activating MFA.
 */

import {
  CognitiveRule,
  DisguiseConfig,
  Radix26State,
} from '../types.js';
import { encodeRadix26, formatDisguisedHint } from '../core/radix26.js';
import { applyCognitiveTransformation } from '../core/cognitive.js';

export interface TrainingChallenge {
  step: number;
  simulatedCounter: number;
  state: Radix26State;
  disguisedHint: string;
  expectedTransformedPassword: string;
}

export class CognitiveOnboardingWizard {
  /**
   * Generates a 3-step interactive training simulation for the chosen rule
   */
  static generateTrainingSession(
    masterPassword: string,
    rule: CognitiveRule,
    disguise: DisguiseConfig = { mode: 'codename-word' }
  ): TrainingChallenge[] {
    const testCounters = [0, 5, 13]; // Tests: Initial (0), Falcon/Mid (5), Nexus (13)
    const challenges: TrainingChallenge[] = [];

    for (let i = 0; i < testCounters.length; i++) {
      const counter = testCounters[i];
      const state = encodeRadix26(counter);
      const disguisedHint = formatDisguisedHint(
        state.hint,
        disguise,
        state.wordHint,
        state.objectHint,
        state.captchaToken,
        state.gridMatrix
      );

      const expectedTransformedPassword = applyCognitiveTransformation(
        masterPassword,
        state,
        rule
      );

      challenges.push({
        step: i + 1,
        simulatedCounter: counter,
        state,
        disguisedHint,
        expectedTransformedPassword,
      });
    }

    return challenges;
  }

  /**
   * Validates user's dry-run test input during onboarding
   */
  static verifyTrainingAttempt(
    userAttempt: string,
    challenge: TrainingChallenge,
    caseSensitive: boolean = false
  ): boolean {
    const attempt = userAttempt.trim();
    const expected = challenge.expectedTransformedPassword.trim();
    if (caseSensitive) {
      return attempt === expected;
    }
    return attempt.toLowerCase() === expected.toLowerCase();
  }

  /**
   * Pre-configured standard cognitive profiles for easy selection
   */
  static getPresetProfiles(): Array<{
    id: string;
    name: string;
    description: string;
    recommendedFor: string;
    difficulty: 'Instant (0s)' | 'Easy (1s)' | 'Power-User (2s)' | 'Ultra-Secure (3m)';
    rule: CognitiveRule;
    disguise: DisguiseConfig;
  }> {
    return [
      {
        id: 'slot-placement-audio',
        name: 'Gesprochenes Audio-Wort (100% Schulterblick-sicher)',
        description: 'Stimme spricht ein klares Wort (z. B. "Tiger" -> T...r an Slot 2 & 5)',
        recommendedFor: 'Reisen, öffentliche Terminals, Kameraschutz',
        difficulty: 'Easy (1s)',
        rule: { type: 'slot-placement', slots: [2, 5], modality: 'audio' },
        disguise: { mode: 'spoken-audio' },
      },
      {
        id: 'slot-placement-questions',
        name: 'Persönliche Lebensfragen (Höchste Sicherheitsstufe)',
        description: 'Beantwortet 1 von 18+ biografischen Lebensfragen (z. B. Grundschule "Goethe" -> G...e)',
        recommendedFor: 'Executive Access, Air-Gapped SCIF & High-Threat Umgebungen',
        difficulty: 'Ultra-Secure (3m)',
        rule: { type: 'slot-placement', slots: [2, 5], modality: 'personal-questions' },
        disguise: { mode: 'personal-questions' },
      },
      {
        id: 'slot-placement-text',
        name: 'Codename / Zufalls-Code (0-Latenz)',
        description: 'Nutzt ersten und letzten Buchstaben eines Codenamens (z. B. "Falcon" -> F...n an Slot 2 & 5)',
        recommendedFor: '90% aller Nutzer, höchste Geschwindigkeit',
        difficulty: 'Instant (0s)',
        rule: { type: 'slot-placement', slots: [2, 5], modality: 'text' },
        disguise: { mode: 'codename-word' },
      },
      {
        id: 'slot-placement-image',
        name: 'Bild-/Icon-Erkennung (Sprachbarriere-Schutz)',
        description: 'Erkennt Alltagsgegenstände (z. B. 🎩 "Hut" -> H...t an Slot 2 & 5)',
        recommendedFor: 'Reinräume, internationale Teams, Anti-OCR Schutz',
        difficulty: 'Instant (0s)',
        rule: { type: 'slot-placement', slots: [2, 5], modality: 'image', locale: 'de' },
        disguise: { mode: 'pictorial-object', locale: 'de' },
      },
    ];
  }
}
