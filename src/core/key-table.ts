/**
 * Back2IQ StealthAuth - Public Key Table Builder
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 *
 * Shared by client and server: the client builds the table so the server never
 * sees the master password; the server builds it only in the convenience path
 * where a caller hands it the password directly.
 */

import { CognitiveRule, CHALLENGE_SPACE_SIZE } from '../types.js';
import { encodeRadix26 } from './radix26.js';
import { applyCognitiveTransformation } from './cognitive.js';
import { derivePublicKey } from '../crypto/keys.js';

/** One Ed25519 public key per challenge value 1..26. */
export function buildPublicKeyTable(
  masterPassword: string,
  cognitiveRule: CognitiveRule,
  passwordSalt: string
): Record<number, string> {
  const table: Record<number, string> = {};

  for (let index = 1; index <= CHALLENGE_SPACE_SIZE; index++) {
    const state = encodeRadix26(index - 1);
    const transformed = applyCognitiveTransformation(masterPassword, state, cognitiveRule);
    table[index] = derivePublicKey(passwordSalt, transformed);
  }

  return table;
}
