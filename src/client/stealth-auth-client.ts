/**
 * Back2IQ StealthAuth - Lightweight Client SDK & Cognitive UI Helper
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import {
  ChallengePayload,
  AuthResponsePayload,
  CognitiveRule,
  DisguiseConfig,
  DisguiseMode,
  Radix26State,
} from '../types.js';
import { decodeRadix26, extractHintFromDisguise, formatDisguisedHint, encodeRadix26 } from '../core/radix26.js';
import { applyCognitiveTransformation } from '../core/cognitive.js';
import { computeClientResponseHash, computeStateVerifier } from '../crypto/hasher.js';

export class StealthAuthClient {
  /**
   * Resolves a Radix-26 state from a disguised UI text string
   */
  static parseHint(
    disguisedOrRawText: string,
    mode: DisguiseMode = 'build-version'
  ): Radix26State | null {
    return extractHintFromDisguise(disguisedOrRawText, mode);
  }

  /**
   * Performs cognitive transformation on master password
   */
  static transformPassword(
    masterPassword: string,
    stateOrHint: Radix26State | string,
    rule: CognitiveRule
  ): string {
    const state = typeof stateOrHint === 'string'
      ? decodeRadix26(stateOrHint)
      : stateOrHint;

    return applyCognitiveTransformation(masterPassword, state, rule);
  }

  /**
   * Generates a precomputed Zero-Knowledge verifier table for a counter range.
   * Allows the server to verify candidate window states without EVER seeing the plaintext password!
   */
  static generateVerifierTable(
    masterPassword: string,
    rule: CognitiveRule,
    passwordSalt: string,
    startCounter = 0,
    count = 500
  ): Record<number, string> {
    const table: Record<number, string> = {};

    for (let c = startCounter; c < startCounter + count; c++) {
      const state = encodeRadix26(c);
      const transformed = applyCognitiveTransformation(masterPassword, state, rule);
      table[c] = computeStateVerifier(passwordSalt, transformed);
    }

    return table;
  }

  /**
   * Prepares the encrypted/hashed response payload to be sent to the authentication server
   */
  static createAuthResponse(
    transformedPassword: string,
    challenge: ChallengePayload,
    passwordSalt?: string
  ): AuthResponsePayload {
    const responseHash = computeClientResponseHash(
      transformedPassword,
      challenge.nonce,
      challenge.sessionId,
      passwordSalt || challenge.passwordSalt
    );

    return {
      sessionId: challenge.sessionId,
      responseHash,
      clientTimestamp: Date.now(),
    };
  }

  /**
   * Helper to format hints for custom client-side renderers
   */
  static formatDisguise(hint: string, config: DisguiseConfig): string {
    return formatDisguisedHint(hint, config);
  }
}
