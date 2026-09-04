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

    case 'slot-placement': {
      const slots = step.slots ?? [2, 5];
      let word = '';

      if (step.modality === 'personal-questions' || state.questionHint) {
        word = state.questionHint?.exampleAnswer?.[step.locale || 'de'] || 'Secure';
      } else if (step.modality === 'audio' || state.spokenAudioWord) {
        word = state.spokenAudioWord || state.wordHint || 'Secure';
      } else if (step.modality === 'image') {
        word = state.objectHint ? getVisualObjectWord(state.objectHint, step.locale || 'de') : 'Secure';
      } else {
        word = state.wordHint || 'Secure';
      }

      let first = word[0];
      let last = word[word.length - 1];

      if (step.caseMode === 'upper') {
        first = first.toUpperCase();
        last = last.toUpperCase();
      } else if (step.caseMode === 'lower') {
        first = first.toLowerCase();
        last = last.toLowerCase();
      } else {
        first = first.toUpperCase();
        last = last.toLowerCase();
      }

      return applySlotTransformation(currentPassword, first, last, slots);
    }

    case 'prefix': {
      return `${letter}${currentPassword}`;
    }

    case 'suffix': {
      return `${currentPassword}${letter}`;
    }

    case 'caesar-shift': {
      const targetChar = currentPassword[anchor] || '';
      const shiftedChar = shiftCharacter(targetChar, index);
      return `${currentPassword.slice(0, anchor)}${shiftedChar}${currentPassword.slice(anchor + 1)}`;
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

/**
 * Pure slot insertion helper: Inserts char1 at slot1 and char2 at slot2
 * slots are 1-indexed insertion positions.
 */
export function applySlotTransformation(
  base: string,
  char1: string,
  char2: string,
  slots: [number, number]
): string {
  const s1 = Math.max(1, Math.min(slots[0], slots[1]));
  const s2 = Math.max(s1, Math.max(slots[0], slots[1]));

  const p1 = base.slice(0, s1 - 1);
  const p2 = base.slice(s1 - 1, s2 - 1);
  const p3 = base.slice(s2 - 1);

  return `${p1}${char1}${p2}${char2}${p3}`;
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
