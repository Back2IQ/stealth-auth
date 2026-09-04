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
   * Returns the 3 intuitive cognitive zones with dynamic slot resolution
   */
  static getCognitiveZones(passwordOrLength: string | number = 9): Array<{
    id: 'prefix' | 'frame' | 'suffix-digits';
    name: string;
    description: string;
    recommended: boolean;
    available: boolean;
    slots: [number, number];
    samplePreview: string;
  }> {
    const isString = typeof passwordOrLength === 'string';
    const pwd = isString ? passwordOrLength : '';
    const len = isString ? pwd.length : Math.max(4, passwordOrLength);

    let z3Available = true;
    let z3Slot1 = Math.max(1, len - 2);
    let z3Slot2 = Math.max(z3Slot1 + 1, len - 1);

    if (isString) {
      const digitMatch = pwd.match(/\d+$/);
      if (!digitMatch) {
        z3Available = false;
      } else {
        const digitStart = (digitMatch.index ?? 0) + 1;
        z3Slot1 = digitStart;
        z3Slot2 = Math.min(len, digitStart + 1);
      }
    }

    return [
      {
        id: 'prefix',
        name: 'Zone 1: Vorne / Start (Empfohlen)',
        description: 'Ersetzt die ersten zwei Zeichen am Anfang (Start mit Hint, Rest fließt aus dem Muskelgedächtnis)',
        recommended: true,
        available: true,
        slots: [1, 2],
        samplePreview: 'Htheim123',
      },
      {
        id: 'frame',
        name: 'Zone 2: Rahmen (Kopf & Schwanz)',
        description: 'Ersetzt das allererste und das allerletzte Zeichen (Klammert dein Passwort sicher ein)',
        recommended: false,
        available: true,
        slots: [1, -1],
        samplePreview: 'Heheim12t',
      },
      {
        id: 'suffix-digits',
        name: 'Zone 3: Zahlen-Zone (Am Ende)',
        description: 'Ersetzt die ersten zwei Ziffern am Ende (Ersetzt z.B. 123 durch Ht3)',
        recommended: false,
        available: z3Available,
        slots: [z3Slot1, z3Slot2],
        samplePreview: 'GeheimHt3',
      },
    ];
  }

  /**
   * Pre-configured standard cognitive profiles for easy selection
   * Default: In-Place Overwrite (L = const, muscle memory) in Zone 1 (Prefix: [1, 2])
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
        id: 'slot-placement-text',
        name: 'Zone 1: Codename (In-Place Präfix - Empfohlen)',
        description: 'Ersetzt die ersten zwei Zeichen durch den Codenamen (z. B. "Falcon" -> F...n an Slot 1 & 2)',
        recommendedFor: '90% aller Nutzer, maximale Tipp-Geschwindigkeit & konstante Länge',
        difficulty: 'Instant (0s)',
        rule: { type: 'slot-placement', slots: [1, 2], modality: 'text', mode: 'overwrite', zone: 'prefix' },
        disguise: { mode: 'codename-word' },
      },
      {
        id: 'slot-placement-image',
        name: 'Zone 1: Bild-/Icon-Erkennung (In-Place)',
        description: 'Ersetzt die ersten zwei Zeichen durch Bild-Buchstaben (z. B. 🎩 "Hut" -> H...t an Slot 1 & 2)',
        recommendedFor: 'Reinräume, internationale Teams, Anti-OCR Schutz',
        difficulty: 'Instant (0s)',
        rule: { type: 'slot-placement', slots: [1, 2], modality: 'image', locale: 'de', mode: 'overwrite', zone: 'prefix' },
        disguise: { mode: 'pictorial-object', locale: 'de' },
      },
      {
        id: 'slot-placement-audio',
        name: 'Zone 1: Gesprochenes Audio-Wort (In-Place)',
        description: 'Stimme spricht ein klares Wort (z. B. "Tiger" -> T...r an Slot 1 & 2)',
        recommendedFor: 'Reisen, öffentliche Terminals, Kameraschutz',
        difficulty: 'Easy (1s)',
        rule: { type: 'slot-placement', slots: [1, 2], modality: 'audio', mode: 'overwrite', zone: 'prefix' },
        disguise: { mode: 'spoken-audio' },
      },
      {
        id: 'slot-placement-questions',
        name: 'Zone 1: Persönliche Lebensfragen (Höchste Stufe)',
        description: 'Beantwortet biografische Fragen (z. B. Grundschule "Goethe" -> G...e an Slot 1 & 2)',
        recommendedFor: 'Executive Access, Air-Gapped SCIF & High-Threat Umgebungen',
        difficulty: 'Ultra-Secure (3m)',
        rule: { type: 'slot-placement', slots: [1, 2], modality: 'personal-questions', mode: 'overwrite', zone: 'prefix' },
        disguise: { mode: 'personal-questions' },
      },
    ];
  }
}
