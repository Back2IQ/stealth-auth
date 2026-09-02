/**
 * Back2IQ StealthAuth - Cryptographic Primitives & Verification
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { createHmac, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';

/**
 * Generates a cryptographically secure random string (hex encoded)
 */
export function generateSecureNonce(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generates a unique secure session identifier
 */
export function generateSessionId(): string {
  return `sess_${randomBytes(16).toString('hex')}`;
}

/**
 * Computes HMAC-SHA256 of data using key
 */
export function computeHmacSha256(key: string, data: string): string {
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Computes a constant-time secure hash of a password using scrypt KDF
 */
export function computePasswordHash(password: string, salt: string): string {
  const derivedKey = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return derivedKey.toString('hex');
}

/**
 * Computes the client challenge-response hash:
 * Response = HMAC-SHA256(TransformedPassword, Nonce || SessionId)
 */
export function computeClientResponseHash(
  transformedPassword: string,
  nonce: string,
  sessionId: string
): string {
  const payload = `${nonce}:${sessionId}`;
  return computeHmacSha256(transformedPassword, payload);
}

/**
 * Constant-time string comparison to prevent side-channel timing attacks
 */
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

/**
 * Signs a payload with HMAC-SHA256 for tamper-proof storage checksums
 */
export function signPayload(secret: string, payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload, Object.keys(payload).sort());
  return computeHmacSha256(secret, json);
}

/**
 * Verifies payload checksum against tamper secret
 */
export function verifyPayloadSignature(
  secret: string,
  payload: Record<string, unknown>,
  signature: string
): boolean {
  const expected = signPayload(secret, payload);
  return constantTimeCompare(expected, signature);
}
