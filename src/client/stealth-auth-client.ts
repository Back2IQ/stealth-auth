/**
 * Back2IQ DynPass - Lightweight Client SDK & Cognitive UI Helper
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
import { buildPublicKeyTable } from '../core/key-table.js';
import { signChallenge } from '../crypto/keys.js';

export class DynPassClient {
  /**
   * Answers a challenge in one step: transform the master password as the rule
   * says, then sign this session with the key that follows from it.
   *
   * This is the only call a login form needs.
   */
  static answerChallenge(
    masterPassword: string,
    challenge: ChallengePayload,
    rule: CognitiveRule,
    passwordSalt?: string
  ): AuthResponsePayload {
    const transformed = DynPassClient.transformPassword(masterPassword, challenge.hint, rule);
    return DynPassClient.createAuthResponse(transformed, challenge, passwordSalt);
  }

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
   * Performs the cognitive transformation on the master password
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
   * Builds the public key table for all 26 challenge values locally, so a server
   * can be registered without ever receiving the master password.
   */
  static generatePublicKeyTable(
    masterPassword: string,
    rule: CognitiveRule,
    passwordSalt: string
  ): Record<number, string> {
    return buildPublicKeyTable(masterPassword, rule, passwordSalt);
  }

  /**
   * Signs the session with the key derived from an already transformed password.
   */
  static createAuthResponse(
    transformedPassword: string,
    challenge: ChallengePayload,
    passwordSalt?: string
  ): AuthResponsePayload {
    const salt = passwordSalt || challenge.passwordSalt || '';
    const responseHash = signChallenge(
      salt,
      transformedPassword,
      `${challenge.nonce}:${challenge.sessionId}`
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

export { DynPassClient as StealthAuthClient };

