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
  CognitiveRecipe,
  DisguiseConfig,
  DisguiseMode,
  SupportedLocale,
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
    challenge: TrainingChallenge
  ): boolean {
    return userAttempt.trim() === challenge.expectedTransformedPassword;
  }

  /**
   * Pre-configured standard cognitive profiles for easy selection
   */
  static getPresetProfiles(): Array<{
    id: string;
    name: string;
    description: string;
    recommendedFor: string;
    difficulty: 'Instant (0s)' | 'Easy (1s)' | 'Power-User (2s)';
    rule: CognitiveRule;
    disguise: DisguiseConfig;
  }> {
    return [
      {
        id: 'word-boundary-instant',
        name: 'Wort-Grenzen 0-Latenz (Empfohlen)',
        description: 'Nutzt ersten und letzten Buchstaben eines Codenamens (z. B. "Falcon" -> F...n)',
        recommendedFor: '90% aller Mitarbeiter, höchste Geschwindigkeit',
        difficulty: 'Instant (0s)',
        rule: { type: 'word-boundary', caseMode: 'as-is' },
        disguise: { mode: 'codename-word' },
      },
      {
        id: 'pictorial-icon-i18n',
        name: 'Bild-/Icon-Erkennung (Sprachbarriere-Schutz)',
        description: 'Erkennt Alltagsgegenstände (z. B. 🎩 "Hut" -> H...t) in deiner Muttersprache',
        recommendedFor: 'Reinräume, internationale Teams, Anti-OCR Schutz',
        difficulty: 'Instant (0s)',
        rule: { type: 'pictorial-object', locale: 'de' },
        disguise: { mode: 'pictorial-object', locale: 'de' },
      },
      {
        id: 'single-anchor-muscle',
        name: 'Muskelgedächtnis-Anker (Klassisch)',
        description: 'Fügt dynamischen Radix-26 Buchstaben an einer festen Nahtstelle ein',
        recommendedFor: 'Klassische Passwörter mit Sonderzeichen-Block',
        difficulty: 'Easy (1s)',
        rule: { type: 'insert-at-anchor', anchorIndex: 5 },
        disguise: { mode: 'build-version' },
      },
      {
        id: 'math-digit-sum',
        name: 'Quersummen-Offset (Mathematisch)',
        description: 'Fügt die Quersumme des Zählers (z. B. Q(14) = 5) an definierter Stelle ein',
        recommendedFor: 'Zahlenliebhaber & mathematisch affine Teams',
        difficulty: 'Easy (1s)',
        rule: { type: 'digit-sum', anchorIndex: 5 },
        disguise: { mode: 'session-ticket' },
      },
      {
        id: 'grid-matrix-diagonal',
        name: '3x3 Geometrisches Matrix-Gitter',
        description: 'Liest eine 3-stellige Kombination entlang der Hauptdiagonale ab',
        recommendedFor: 'High-Security Terminals, Defense & SCIF',
        difficulty: 'Power-User (2s)',
        rule: { type: 'grid-matrix-traverse', gridPath: 'diagonal-main', anchorIndex: 5 },
        disguise: { mode: 'grid-matrix-3x3' },
      },
    ];
  }
}
