/**
 * Back2IQ StealthAuth - Anti-Desynchronisation & State Engine
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { Radix26State } from '../types.js';
import { encodeRadix26 } from './radix26.js';

export interface WindowCandidate {
  counter: number;
  delta: number; // 0 for exact match, +1, +2, +3 for forward sync, -1 for backward
  state: Radix26State;
}

export interface StateEngineOptions {
  lookforwardWindow?: number;
  lookbackwardWindow?: number;
}

/**
 * Computes candidate counter window states for resilient desynchronization recovery
 */
export function generateCandidateWindow(
  baseCounter: number,
  options: StateEngineOptions = {}
): WindowCandidate[] {
  const fwd = options.lookforwardWindow ?? 3;
  const back = options.lookbackwardWindow ?? 1;

  const candidates: WindowCandidate[] = [];

  // Priority 1: Exact current expected counter (delta = 0)
  if (baseCounter >= 0) {
    candidates.push({
      counter: baseCounter,
      delta: 0,
      state: encodeRadix26(baseCounter),
    });
  }

  // Priority 2: Forward lookahead (+1, +2, +3 ...)
  for (let d = 1; d <= fwd; d++) {
    const c = baseCounter + d;
    candidates.push({
      counter: c,
      delta: d,
      state: encodeRadix26(c),
    });
  }

  // Priority 3: Backward lookback (-1)
  for (let d = 1; d <= back; d++) {
    const c = baseCounter - d;
    if (c >= 0) {
      candidates.push({
        counter: c,
        delta: -d,
        state: encodeRadix26(c),
      });
    }
  }

  return candidates;
}
