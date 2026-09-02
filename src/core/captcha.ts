/**
 * Back2IQ StealthAuth - Pseudo-CAPTCHA Obfuscation Engine
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 * 
 * Generates innocuous anti-bot styled pseudo-CAPTCHA badges
 * where the user uses first and last characters (or first letter / last digit).
 */

import { generateSecureNonce } from '../crypto/hasher.js';

export interface PseudoCaptchaBadge {
  token: string;         // e.g. "X79kmP"
  firstChar: string;     // 'X'
  lastChar: string;      // 'P'
  renderedLabel: string; // "Security Check: [ X 7 9 k m P ]"
}

/**
 * Generates a pseudo-CAPTCHA badge deterministically or pseudo-randomly bound to state
 */
export function generatePseudoCaptchaBadge(
  firstChar: string,
  lastChar: string,
  length = 6
): PseudoCaptchaBadge {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let middle = '';
  const nonce = generateSecureNonce(8);
  for (let i = 0; i < length - 2; i++) {
    const idx = parseInt(nonce.slice(i * 2, i * 2 + 2), 16) % chars.length;
    middle += chars[idx];
  }

  const token = `${firstChar}${middle}${lastChar}`;
  const spaced = token.split('').join(' ');
  const renderedLabel = `Verification: [ ${spaced} ]`;

  return {
    token,
    firstChar,
    lastChar,
    renderedLabel,
  };
}
