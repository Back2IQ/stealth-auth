/**
 * Back2IQ StealthAuth - Mathematical Combinatorics & Transform Operators
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 * 
 * Implements: Quersumme (vorwärts/rückwärts/alternierend), Wurzel, Potenzieren,
 * Spiegeln, Segment-Permutation und Teile-und-Herrsche Bisektion.
 */

/**
 * Computes standard digit sum (Quersumme): Q(14) = 5, Q(128) = 11
 */
export function calculateDigitSum(n: number): number {
  const str = Math.abs(Math.floor(n)).toString();
  return str.split('').reduce((acc, char) => acc + parseInt(char, 10), 0);
}

/**
 * Computes single-digit digital root (Iterierte Quersumme): Q(99) = 18 -> 9
 */
export function calculateDigitalRoot(n: number): number {
  let current = Math.abs(Math.floor(n));
  while (current >= 10) {
    current = calculateDigitSum(current);
  }
  return current;
}

/**
 * Computes alternating digit sum: e.g. 14 -> 1 - 4 = -3 -> 3
 */
export function calculateAlternatingDigitSum(n: number): number {
  const digits = Math.abs(Math.floor(n)).toString().split('').map(Number);
  let result = 0;
  for (let i = 0; i < digits.length; i++) {
    result += (i % 2 === 0 ? 1 : -1) * digits[i];
  }
  return Math.abs(result);
}

/**
 * Computes reversed digit representation: 14 -> "41"
 */
export function reverseNumberString(n: number): string {
  return Math.abs(Math.floor(n)).toString().split('').reverse().join('');
}

/**
 * Computes integer square root floor: floor(sqrt(n))
 */
export function calculateSquareRootFloor(n: number): number {
  return Math.floor(Math.sqrt(Math.max(0, n)));
}

/**
 * Computes power modulo: (base^exponent) % modulo
 */
export function calculatePowerModulo(base: number, exponent = 2, modulo = 10): number {
  if (modulo <= 0) return 0;
  let res = 1;
  let b = Math.abs(base) % modulo;
  let e = Math.abs(exponent);

  while (e > 0) {
    if (e % 2 === 1) res = (res * b) % modulo;
    b = (b * b) % modulo;
    e = Math.floor(e / 2);
  }
  return res;
}

/**
 * Reverses a substring segment within a secret string
 */
export function reverseSegment(
  secret: string,
  start = 0,
  length = secret.length
): string {
  if (!secret) return '';
  const s = Math.max(0, Math.min(start, secret.length - 1));
  const len = Math.max(0, Math.min(length, secret.length - s));

  const prefix = secret.slice(0, s);
  const target = secret.slice(s, s + len).split('').reverse().join('');
  const suffix = secret.slice(s + len);

  return `${prefix}${target}${suffix}`;
}

/**
 * Split & Conquer: Bisection Swap (Teile und Herrsche)
 * Swaps first half and second half of password based on cycle / condition
 */
export function splitAndConquerSwap(secret: string, pivot?: number): string {
  if (!secret || secret.length <= 1) return secret;
  const p = pivot !== undefined 
    ? Math.max(1, Math.min(pivot, secret.length - 1))
    : Math.floor(secret.length / 2);

  const left = secret.slice(0, p);
  const right = secret.slice(p);
  return `${right}${left}`;
}
