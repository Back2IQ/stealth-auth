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
import { decodeRadix26, extractHintFromDisguise, formatDisguisedHint } from '../core/radix26.js';
import { applyCognitiveTransformation } from '../core/cognitive.js';
import { computeClientResponseHash } from '../crypto/hasher.js';

export class StealthAuthClient {
  /**
   * Resolves a Radix-26 state from a disguised UI text string (e.g., "Build v1.14" or "1-14")
   */
  static parseHint(
    disguisedOrRawText: string,
    mode: DisguiseMode = 'build-version'
  ): Radix26State | null {
    return extractHintFromDisguise(disguisedOrRawText, mode);
  }

  /**
   * Performs the cognitive transformation on the master password using the provided hint/state
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
   * Prepares the encrypted/hashed response payload to be sent to the authentication server
   */
  static createAuthResponse(
    transformedPassword: string,
    challenge: ChallengePayload
  ): AuthResponsePayload {
    const responseHash = computeClientResponseHash(
      transformedPassword,
      challenge.nonce,
      challenge.sessionId
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
