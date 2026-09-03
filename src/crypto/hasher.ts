/**
 * Back2IQ StealthAuth - Session Primitives
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 *
 * Challenge answering lives in ./keys.ts; what remains here is session material
 * and the HMAC used to sign issued auth tokens.
 */

import { createHmac, randomBytes, randomInt } from 'node:crypto';

export function generateSecureNonce(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex');
}

export function generateSessionId(): string {
  return `sess_${randomBytes(16).toString('hex')}`;
}

/** Uniform random integer in [min, max], both inclusive. */
export function drawRandomInt(min: number, max: number): number {
  return randomInt(min, max + 1);
}

export function computeHmacSha256(key: string, data: string): string {
  return createHmac('sha256', key).update(data).digest('hex');
}
