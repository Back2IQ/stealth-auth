/**
 * Back2IQ StealthAuth - Cryptographic Primitives & Verification
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { createHmac, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';

export function generateSecureNonce(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex');
}

export function generateSessionId(): string {
  return `sess_${randomBytes(16).toString('hex')}`;
}

export function computeHmacSha256(key: string, data: string): string {
  return createHmac('sha256', key).update(data).digest('hex');
}

export function computePasswordHash(password: string, salt: string): string {
  const derivedKey = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return derivedKey.toString('hex');
}

/**
 * Derives the single-state client verifier token:
 * V_N = HMAC-SHA256(PasswordSalt, TransformedPassword)
 */
export function computeStateVerifier(passwordSalt: string, transformedPassword: string): string {
  return computeHmacSha256(passwordSalt, transformedPassword);
}

/**
 * Computes the client challenge-response hash using the state verifier:
 * Response = HMAC-SHA256(StateVerifier, Nonce || SessionId)
 */
export function computeClientResponseHash(
  transformedPasswordOrVerifier: string,
  nonce: string,
  sessionId: string,
  passwordSalt?: string
): string {
  const payload = `${nonce}:${sessionId}`;
  // If salt is provided, derive verifier first; otherwise assume it's already the verifier token
  const verifierToken = passwordSalt
    ? computeStateVerifier(passwordSalt, transformedPasswordOrVerifier)
    : transformedPasswordOrVerifier;

  return computeHmacSha256(verifierToken, payload);
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function signPayload(secret: string, payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload, Object.keys(payload).sort());
  return computeHmacSha256(secret, json);
}

export function verifyPayloadSignature(
  secret: string,
  payload: Record<string, unknown>,
  signature: string
): boolean {
  const expected = signPayload(secret, payload);
  return constantTimeCompare(expected, signature);
}
