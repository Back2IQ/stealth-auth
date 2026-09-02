/**
 * Back2IQ StealthAuth - Composable Cognitive Pipeline & Recipe Engine
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 * 
 * Allows users to construct personalized multi-step cognitive recipes:
 * Combining Digit-Sum (Quersumme), Square-Root, Power-Modulo, Reversal,
 * Diagonal/Vertical Grid Traversal, and Split-and-Conquer.
 */

import { Radix26State, PipelineStep, CognitiveRecipe } from '../types.js';
import {
  calculateDigitSum,
  calculateDigitalRoot,
  calculateAlternatingDigitSum,
  reverseNumberString,
  calculateSquareRootFloor,
  calculatePowerModulo,
  reverseSegment,
  splitAndConquerSwap,
} from './math-operators.js';
import { traverse3x3Grid } from './matrix-grid.js';
import { getVisualObjectWord } from './pictorial.js';

/**
 * Executes a single pipeline step on the evolving password string
 */
export function executePipelineStep(
  currentPassword: string,
  state: Radix26State,
  step: PipelineStep
): string {
  const { counter, index, letter, wordHint, objectHint, captchaToken, gridMatrix } = state;
  const anchor = Math.max(0, Math.min(step.anchorIndex ?? 0, currentPassword.length));

  switch (step.op) {
    case 'digit-sum': {
      // Quersumme: Q(Counter + 1) e.g. 14 -> 5
      const sum = calculateDigitSum(counter + 1);
      return `${currentPassword.slice(0, anchor)}${sum}${currentPassword.slice(anchor)}`;
    }

    case 'digital-root': {
      // Iterierte einstellige Quersumme: e.g. 99 -> 9
      const root = calculateDigitalRoot(counter + 1);
      return `${currentPassword.slice(0, anchor)}${root}${currentPassword.slice(anchor)}`;
    }

    case 'digit-sum-reverse': {
      // Quersumme rückwärts / gespiegelte Ziffern: e.g. 14 -> "41"
      const reversed = reverseNumberString(counter + 1);
      return `${currentPassword.slice(0, anchor)}${reversed}${currentPassword.slice(anchor)}`;
    }

    case 'alternating-digit-sum': {
      // Alternierende Quersumme: e.g. 14 -> 3
      const altSum = calculateAlternatingDigitSum(counter + 1);
      return `${currentPassword.slice(0, anchor)}${altSum}${currentPassword.slice(anchor)}`;
    }

    case 'square-root-floor': {
      // Ganzzahlige Wurzel: sqrt(Index) e.g. sqrt(16) -> 4
      const sqrtVal = calculateSquareRootFloor(index);
      return `${currentPassword.slice(0, anchor)}${sqrtVal}${currentPassword.slice(anchor)}`;
    }

    case 'power-modulo': {
      // Potenzieren & Modulo: (Index^exp) % mod
      const exp = step.exponent ?? 2;
      const mod = step.modulo ?? 10;
      const powVal = calculatePowerModulo(index, exp, mod);
      return `${currentPassword.slice(0, anchor)}${powVal}${currentPassword.slice(anchor)}`;
    }

    case 'reverse-segment': {
      // Spiegeln / Umdrehen eines Teilsegments
      const start = step.segmentStart ?? 0;
      const len = step.segmentLength ?? currentPassword.length;
      return reverseSegment(currentPassword, start, len);
    }

    case 'split-and-conquer': {
      // Teile und Herrsche (Bisection Swap)
      return splitAndConquerSwap(currentPassword, step.anchorIndex);
    }

    case 'grid-matrix-traverse': {
      // 3x3 Geometrischer Pfad (Diagonal, Horizontal, Vertikal, Zigzag)
      if (gridMatrix) {
        const path = step.gridPath ?? 'diagonal-main';
        const key = traverse3x3Grid(gridMatrix, path);
        return `${currentPassword.slice(0, anchor)}${key}${currentPassword.slice(anchor)}`;
      }
      return `${currentPassword.slice(0, anchor)}SEC${currentPassword.slice(anchor)}`;
    }

    case 'word-boundary': {
      const word = wordHint || 'Secure';
      let firstChar = word[0];
      let lastChar = word[word.length - 1];
      if (step.caseMode === 'upper') {
        firstChar = firstChar.toUpperCase();
        lastChar = lastChar.toUpperCase();
      } else if (step.caseMode === 'lower') {
        firstChar = firstChar.toLowerCase();
        lastChar = lastChar.toLowerCase();
      }
      return `${firstChar}${currentPassword}${lastChar}`;
    }

    case 'pictorial-object': {
      const obj = objectHint || state.objectHint!;
      const locale = step.locale || 'de';
      const word = getVisualObjectWord(obj, locale);
      let first = word[0].toUpperCase();
      let last = word[word.length - 1].toLowerCase();
      return `${first}${currentPassword}${last}`;
    }

    case 'pseudo-captcha': {
      const token = captchaToken || 'X492yZ';
      return `${token[0]}${currentPassword}${token[token.length - 1]}`;
    }

    case 'insert-at-anchor': {
      return `${currentPassword.slice(0, anchor)}${letter}${currentPassword.slice(anchor)}`;
    }

    case 'prefix': {
      return `${letter}${currentPassword}`;
    }

    case 'suffix': {
      return `${currentPassword}${letter}`;
    }

    case 'custom': {
      if (step.customTransform) {
        return step.customTransform(currentPassword, state);
      }
      return currentPassword;
    }

    default:
      return currentPassword;
  }
}

/**
 * Executes a full multi-step Cognitive Recipe pipeline
 */
export function executeRecipePipeline(
  baseSecret: string,
  state: Radix26State,
  recipe: CognitiveRecipe
): string {
  let result = baseSecret;
  for (const step of recipe.steps) {
    result = executePipelineStep(result, state, step);
  }
  return result;
}
