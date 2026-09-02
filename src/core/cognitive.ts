/**
 * Back2IQ StealthAuth - Cognitive Transformation Engine
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { Radix26State, CognitiveRule } from '../types.js';
import { encodeRadix26 } from './radix26.js';
import { getVisualObjectWord } from './pictorial.js';
import { executePipelineStep, executeRecipePipeline } from './pipeline.js';

/**
 * Executes cognitive transformation T(S, State, Rule) on the user's master salt S.
 */
export function applyCognitiveTransformation(
  baseSecret: string,
  state: Radix26State,
  rule: CognitiveRule
): string {
  if (!baseSecret) {
    throw new Error('Base secret cannot be empty');
  }

  // 1. Pipeline / Custom Recipe Mode
  if (rule.type === 'pipeline' && rule.recipe) {
    return executeRecipePipeline(baseSecret, state, rule.recipe);
  }

  // 2. Standalone Math & Combinatorics Operators
  if (
    rule.type === 'digit-sum' ||
    rule.type === 'digital-root' ||
    rule.type === 'digit-sum-reverse' ||
    rule.type === 'alternating-digit-sum' ||
    rule.type === 'square-root-floor' ||
    rule.type === 'power-modulo' ||
    rule.type === 'reverse-segment' ||
    rule.type === 'split-and-conquer' ||
    rule.type === 'grid-matrix-traverse'
  ) {
    return executePipelineStep(baseSecret, state, {
      op: rule.type,
      anchorIndex: rule.anchorIndex,
      anchorIndex2: rule.anchorIndex2,
      exponent: rule.exponent,
      modulo: rule.modulo,
      gridPath: rule.gridPath,
      locale: rule.locale,
      caseMode: rule.caseMode,
    });
  }

  const { letter, index, wordHint, objectHint, captchaToken } = state;

  switch (rule.type) {
    case 'pictorial-object': {
      const obj = objectHint || encodeRadix26(state.counter).objectHint!;
      const locale = rule.locale || 'de';
      const localizedWord = getVisualObjectWord(obj, locale);

      let firstChar = localizedWord[0];
      let lastChar = localizedWord[localizedWord.length - 1];

      if (rule.caseMode === 'upper') {
        firstChar = firstChar.toUpperCase();
        lastChar = lastChar.toUpperCase();
      } else if (rule.caseMode === 'lower') {
        firstChar = firstChar.toLowerCase();
        lastChar = lastChar.toLowerCase();
      } else {
        firstChar = firstChar.toUpperCase();
        lastChar = lastChar.toLowerCase();
      }

      return `${firstChar}${baseSecret}${lastChar}`;
    }

    case 'pseudo-captcha': {
      const token = captchaToken || 'X492yZ';
      return `${token[0]}${baseSecret}${token[token.length - 1]}`;
    }

    case 'word-boundary': {
      const word = wordHint || 'Secure';
      let firstChar = word[0];
      let lastChar = word[word.length - 1];

      if (rule.caseMode === 'upper') {
        firstChar = firstChar.toUpperCase();
        lastChar = lastChar.toUpperCase();
      } else if (rule.caseMode === 'lower') {
        firstChar = firstChar.toLowerCase();
        lastChar = lastChar.toLowerCase();
      }

      return `${firstChar}${baseSecret}${lastChar}`;
    }

    case 'insert-at-anchor': {
      const anchor = Math.max(0, Math.min(rule.anchorIndex ?? 0, baseSecret.length));
      return baseSecret.slice(0, anchor) + letter + baseSecret.slice(anchor);
    }

    case 'prefix': {
      return letter + baseSecret;
    }

    case 'suffix': {
      return baseSecret + letter;
    }

    case 'caesar-shift': {
      const anchor = Math.max(0, Math.min(rule.anchorIndex ?? 0, baseSecret.length - 1));
      const targetChar = baseSecret[anchor];
      const shiftedChar = shiftCharacter(targetChar, index);
      return baseSecret.slice(0, anchor) + shiftedChar + baseSecret.slice(anchor + 1);
    }

    case 'custom': {
      if (rule.customTransform) {
        return rule.customTransform(baseSecret, state);
      }
      throw new Error('Custom transformation specified without customTransform function');
    }

    default:
      throw new Error(`Unsupported cognitive transformation type: ${(rule as CognitiveRule).type}`);
  }
}

function shiftCharacter(char: string, shift: number): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(65 + ((code - 65 + shift) % 26));
  }
  if (code >= 97 && code <= 122) {
    return String.fromCharCode(97 + ((code - 97 + shift) % 26));
  }
  if (code >= 48 && code <= 57) {
    return String.fromCharCode(48 + ((code - 48 + shift) % 10));
  }
  return char;
}

export function generateEmergencyResyncSequence(targetCounter: number): {
  stateA: Radix26State;
  stateB: Radix26State;
  resyncToken: string;
} {
  const stateA = encodeRadix26(targetCounter);
  const stateB = encodeRadix26(targetCounter + 1);
  const resyncToken = `RSYNC-${stateA.hint}:${stateB.hint}`;

  return {
    stateA,
    stateB,
    resyncToken,
  };
}
