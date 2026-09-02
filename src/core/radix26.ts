/**
 * Back2IQ StealthAuth - Radix-26 State Machine & Hint Codec
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { Radix26State, DisguiseConfig, DisguiseMode, VisualObjectHint } from '../types.js';
import { getWordForState } from './word-dictionary.js';
import { getVisualObjectForState, getVisualObjectWord } from './pictorial.js';
import { generatePseudoCaptchaBadge } from './captcha.js';
import { generate3x3GridMatrix, formatGridMatrixAscii } from './matrix-grid.js';

/**
 * Returns the uppercase character corresponding to index 1..26 (1='A', 26='Z')
 */
export function getLetterForIndex(index: number): string {
  if (index < 1 || index > 26 || !Number.isInteger(index)) {
    throw new RangeError(`Index must be an integer between 1 and 26. Received: ${index}`);
  }
  return String.fromCharCode(64 + index);
}

/**
 * Returns the index 1..26 for uppercase character 'A'..'Z'
 */
export function getIndexForLetter(letter: string): number {
  if (!letter || letter.length !== 1) {
    throw new TypeError(`Letter must be a single character. Received: "${letter}"`);
  }
  const code = letter.toUpperCase().charCodeAt(0);
  if (code < 65 || code > 90) {
    throw new RangeError(`Letter must be A-Z (case-insensitive). Received: "${letter}"`);
  }
  return code - 64;
}

/**
 * Encodes a sequential counter N into a Radix26State tuple
 */
export function encodeRadix26(counter: number): Radix26State {
  if (counter < 0 || !Number.isInteger(counter)) {
    throw new RangeError(`Counter must be a non-negative integer. Received: ${counter}`);
  }

  const cycle = Math.floor(counter / 26);
  const index = (counter % 26) + 1;
  const letter = getLetterForIndex(index);
  const hint = cycle === 0 ? `${index}` : `${cycle}-${index}`;
  const wordHint = getWordForState(index, cycle);
  const objectHint = getVisualObjectForState(index, cycle);
  const gridMatrix = generate3x3GridMatrix(counter, cycle);

  const lastLetter = getLetterForIndex(((index + cycle * 3) % 26) + 1).toLowerCase();
  const captcha = generatePseudoCaptchaBadge(letter, lastLetter);

  return {
    counter,
    cycle,
    index,
    letter,
    hint,
    wordHint,
    objectHint,
    captchaToken: captcha.token,
    gridMatrix,
  };
}

/**
 * Decodes a standard hint string back into a Radix26State
 */
export function decodeRadix26(hint: string): Radix26State {
  if (!hint || typeof hint !== 'string') {
    throw new TypeError(`Hint must be a non-empty string. Received: ${hint}`);
  }

  const trimmed = hint.trim();
  const dashIndex = trimmed.indexOf('-');

  let cycle: number;
  let index: number;

  if (dashIndex === -1) {
    cycle = 0;
    index = parseInt(trimmed, 10);
    if (isNaN(index)) {
      throw new Error(`Invalid hint format: "${hint}"`);
    }
  } else {
    const cycleStr = trimmed.slice(0, dashIndex);
    const indexStr = trimmed.slice(dashIndex + 1);

    cycle = parseInt(cycleStr, 10);
    index = parseInt(indexStr, 10);

    if (isNaN(cycle) || isNaN(index) || cycle < 1) {
      throw new Error(`Invalid cycle/index in hint: "${hint}"`);
    }
  }

  if (index < 1 || index > 26) {
    throw new RangeError(`Index in hint must be between 1 and 26. Received: ${index} from "${hint}"`);
  }

  const counter = cycle * 26 + (index - 1);
  const letter = getLetterForIndex(index);
  const wordHint = getWordForState(index, cycle);
  const objectHint = getVisualObjectForState(index, cycle);
  const gridMatrix = generate3x3GridMatrix(counter, cycle);

  const lastLetter = getLetterForIndex(((index + cycle * 3) % 26) + 1).toLowerCase();
  const captcha = generatePseudoCaptchaBadge(letter, lastLetter);

  return {
    counter,
    cycle,
    index,
    letter,
    hint: cycle === 0 ? `${index}` : `${cycle}-${index}`,
    wordHint,
    objectHint,
    captchaToken: captcha.token,
    gridMatrix,
  };
}

/**
 * Formats a raw Radix-26 hint string into an innocuous UI disguise
 */
export function formatDisguisedHint(
  hint: string,
  config: DisguiseConfig,
  wordHint?: string,
  objectHint?: VisualObjectHint,
  captchaToken?: string,
  gridMatrix?: string[][]
): string {
  const { mode, locale = 'de', customTemplate } = config;

  switch (mode) {
    case 'build-version':
      return formatAsBuildVersion(hint);
    case 'session-ticket':
      return `Ticket #${hint}`;
    case 'patch-id':
      return `SEC-PATCH-${hint}`;
    case 'status-badge':
      return `Node-${hint}-OK`;
    case 'codename-word': {
      const activeWord = wordHint || decodeRadix26(hint).wordHint || 'System';
      return `Codename: ${activeWord}`;
    }
    case 'pictorial-object': {
      const obj = objectHint || decodeRadix26(hint).objectHint || getVisualObjectForState(1);
      const localized = getVisualObjectWord(obj, locale);
      return `Icon: [ ${obj.objectId} ] (${localized})`;
    }
    case 'pseudo-captcha': {
      const token = captchaToken || decodeRadix26(hint).captchaToken || 'X492yZ';
      const spaced = token.split('').join(' ');
      return `Security Check: [ ${spaced} ]`;
    }
    case 'grid-matrix-3x3': {
      const matrix = gridMatrix || decodeRadix26(hint).gridMatrix || generate3x3GridMatrix(0);
      return formatGridMatrixAscii(matrix);
    }
    case 'custom':
      if (customTemplate) {
        let result = customTemplate.replace('{hint}', hint);
        if (wordHint) result = result.replace('{word}', wordHint);
        return result;
      }
      return hint;
    case 'raw':
    default:
      return hint;
  }
}

function formatAsBuildVersion(hint: string): string {
  const state = decodeRadix26(hint);
  return `v${state.cycle + 1}.${state.index}`;
}

export function extractHintFromDisguise(
  disguisedText: string,
  mode: DisguiseMode = 'build-version'
): Radix26State | null {
  if (!disguisedText) return null;

  try {
    if (mode === 'codename-word') {
      const match = disguisedText.match(/(?:Codename:\s*|Host:\s*|Release:\s*)?([A-Za-z]+)/i);
      if (match && match[1]) {
        const word = match[1];
        const firstLetter = word[0].toUpperCase();
        const index = getIndexForLetter(firstLetter);
        return encodeRadix26(index - 1);
      }
    }

    if (mode === 'build-version') {
      const match = disguisedText.match(/v?(\d+)\.(\d+)/i);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        const cycle = Math.max(0, major - 1);
        const index = minor;
        if (index >= 1 && index <= 26 && cycle >= 0) {
          const counter = cycle * 26 + (index - 1);
          return encodeRadix26(counter);
        }
      }
    }

    const genericMatch = disguisedText.match(/(\d+)-(\d+)|(?:\b|\D)(\d{1,2})(?:\b|\D|$)/);
    if (genericMatch) {
      if (genericMatch[1] && genericMatch[2]) {
        return decodeRadix26(`${genericMatch[1]}-${genericMatch[2]}`);
      }
      if (genericMatch[3]) {
        const idx = parseInt(genericMatch[3], 10);
        if (idx >= 1 && idx <= 26) {
          return decodeRadix26(`${idx}`);
        }
      }
    }

    return decodeRadix26(disguisedText);
  } catch {
    return null;
  }
}
