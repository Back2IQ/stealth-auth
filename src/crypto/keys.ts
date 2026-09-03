/**
 * Back2IQ StealthAuth - Per-Challenge Key Derivation (Ed25519)
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 *
 * Each challenge value gets its own keypair, deterministically derived from the
 * cognitively transformed password. The client signs; the server stores only
 * public keys. A stolen database therefore contains nothing that can answer a
 * challenge, and nothing that can be cheaply brute-forced back into a password.
 */

import { createPrivateKey, createPublicKey, scryptSync, sign, verify, KeyObject } from 'node:crypto';

/** DER/PKCS8 header for a raw 32-byte Ed25519 seed. */
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

/** scrypt work factors (~60ms per derivation). */
const KDF_PARAMS = { N: 16384, r: 8, p: 1 } as const;
const SEED_BYTES = 32;

function privateKeyFor(passwordSalt: string, transformedPassword: string): KeyObject {
  const seed = scryptSync(transformedPassword, passwordSalt, SEED_BYTES, KDF_PARAMS);
  return createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, seed]),
    format: 'der',
    type: 'pkcs8',
  });
}

/** The public half the server stores for one challenge value. */
export function derivePublicKey(passwordSalt: string, transformedPassword: string): string {
  const publicKey = createPublicKey(privateKeyFor(passwordSalt, transformedPassword));
  return publicKey.export({ format: 'der', type: 'spki' }).toString('hex');
}

/** Signs the session-bound message with the key for this challenge value. */
export function signChallenge(
  passwordSalt: string,
  transformedPassword: string,
  message: string
): string {
  return sign(null, Buffer.from(message), privateKeyFor(passwordSalt, transformedPassword)).toString('hex');
}

/** Verifies a signature against a stored public key. Never throws on malformed input. */
export function verifyChallengeSignature(
  publicKeyHex: string,
  message: string,
  signatureHex: string
): boolean {
  try {
    const publicKey = createPublicKey({
      key: Buffer.from(publicKeyHex, 'hex'),
      format: 'der',
      type: 'spki',
    });
    return verify(null, Buffer.from(message), publicKey, Buffer.from(signatureHex, 'hex'));
  } catch {
    return false;
  }
}
