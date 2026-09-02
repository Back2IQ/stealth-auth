import { describe, it, expect } from 'vitest';
import {
  encodeRadix26,
  decodeRadix26,
  getLetterForIndex,
  getIndexForLetter,
  formatDisguisedHint,
  extractHintFromDisguise,
} from '../src/core/radix26.js';

describe('Radix-26 Mathematical & Hint Engine', () => {
  describe('Alphabet Index Mappings', () => {
    it('maps 1..26 correctly to A..Z', () => {
      expect(getLetterForIndex(1)).toBe('A');
      expect(getLetterForIndex(2)).toBe('B');
      expect(getLetterForIndex(14)).toBe('N');
      expect(getLetterForIndex(26)).toBe('Z');
    });

    it('maps A..Z correctly to 1..26', () => {
      expect(getIndexForLetter('A')).toBe(1);
      expect(getIndexForLetter('B')).toBe(2);
      expect(getIndexForLetter('N')).toBe(14);
      expect(getIndexForLetter('Z')).toBe(26);
      expect(getIndexForLetter('a')).toBe(1); // case-insensitive
    });

    it('throws errors on out-of-range index or invalid characters', () => {
      expect(() => getLetterForIndex(0)).toThrow(RangeError);
      expect(() => getLetterForIndex(27)).toThrow(RangeError);
      expect(() => getIndexForLetter('1')).toThrow(RangeError);
      expect(() => getIndexForLetter('AB')).toThrow(TypeError);
    });
  });

  describe('Radix-26 Encoding (Counter -> State)', () => {
    it('encodes Cycle 0 (N = 0..25) correctly without cycle prefix', () => {
      const state0 = encodeRadix26(0);
      expect(state0).toMatchObject({
        counter: 0,
        cycle: 0,
        index: 1,
        letter: 'A',
        hint: '1',
        wordHint: 'Atlas',
      });
      expect(state0.objectHint?.objectId).toBe('hat');
      expect(state0.captchaToken).toBeDefined();

      const state13 = encodeRadix26(13);
      expect(state13).toMatchObject({
        counter: 13,
        cycle: 0,
        index: 14,
        letter: 'N',
        hint: '14',
        wordHint: 'Nexus',
      });

      const state25 = encodeRadix26(25);
      expect(state25).toMatchObject({
        counter: 25,
        cycle: 0,
        index: 26,
        letter: 'Z',
        hint: '26',
        wordHint: 'Zenith',
      });
    });

    it('encodes Cycle 1 (N = 26..51) with "1-I" format', () => {
      const state26 = encodeRadix26(26);
      expect(state26).toMatchObject({
        counter: 26,
        cycle: 1,
        index: 1,
        letter: 'A',
        hint: '1-1',
        wordHint: 'Apollo',
      });

      const state51 = encodeRadix26(51);
      expect(state51).toMatchObject({
        counter: 51,
        cycle: 1,
        index: 26,
        letter: 'Z',
        hint: '1-26',
        wordHint: 'Zephyr',
      });
    });

    it('encodes Cycle 2 (N = 52..77) with "2-I" format', () => {
      const state52 = encodeRadix26(52);
      expect(state52).toMatchObject({
        counter: 52,
        cycle: 2,
        index: 1,
        letter: 'A',
        hint: '2-1',
        wordHint: 'Apex',
      });
    });

    it('handles high counter values deterministically', () => {
      const state1000 = encodeRadix26(1000);
      expect(state1000.cycle).toBe(38);
      expect(state1000.index).toBe(13);
      expect(state1000.letter).toBe('M');
      expect(state1000.hint).toBe('38-13');
      expect(state1000.wordHint).toBeDefined();
    });
  });

  describe('Radix-26 Decoding (Hint -> State) & Bijective Integrity', () => {
    it('decodes Cycle 0 hints ("1".."26")', () => {
      const state = decodeRadix26('14');
      expect(state.counter).toBe(13);
      expect(state.cycle).toBe(0);
      expect(state.index).toBe(14);
      expect(state.letter).toBe('N');
      expect(state.wordHint).toBe('Nexus');
    });

    it('decodes Cycle 1+ hints ("1-14", "2-1")', () => {
      const state1_14 = decodeRadix26('1-14');
      expect(state1_14.counter).toBe(1 * 26 + 13);
      expect(state1_14.cycle).toBe(1);
      expect(state1_14.index).toBe(14);
      expect(state1_14.letter).toBe('N');

      const state2_1 = decodeRadix26('2-1');
      expect(state2_1.counter).toBe(52);
      expect(state2_1.cycle).toBe(2);
      expect(state2_1.index).toBe(1);
      expect(state2_1.letter).toBe('A');
    });

    it('proves bijectivity: decode(encode(N)).counter === N for 0..1000', () => {
      for (let n = 0; n <= 1000; n++) {
        const encoded = encodeRadix26(n);
        const decoded = decodeRadix26(encoded.hint);
        expect(decoded.counter).toBe(n);
        expect(decoded.cycle).toBe(encoded.cycle);
        expect(decoded.index).toBe(encoded.index);
        expect(decoded.letter).toBe(encoded.letter);
      }
    });

    it('throws on malformed hints', () => {
      expect(() => decodeRadix26('0')).toThrow(RangeError);
      expect(() => decodeRadix26('27')).toThrow(RangeError);
      expect(() => decodeRadix26('abc')).toThrow();
      expect(() => decodeRadix26('0-5')).toThrow();
      expect(() => decodeRadix26('1-27')).toThrow(RangeError);
    });
  });

  describe('Disguise Formatter & Extractor', () => {
    it('formats build-version disguise correctly', () => {
      expect(formatDisguisedHint('14', { mode: 'build-version' })).toBe('v1.14');
      expect(formatDisguisedHint('1-14', { mode: 'build-version' })).toBe('v2.14');
      expect(formatDisguisedHint('2-1', { mode: 'build-version' })).toBe('v3.1');
    });

    it('formats ticket, patch, and pictorial disguises', () => {
      expect(formatDisguisedHint('1-14', { mode: 'session-ticket' })).toBe('Ticket #1-14');
      expect(formatDisguisedHint('1-14', { mode: 'patch-id' })).toBe('SEC-PATCH-1-14');
      expect(formatDisguisedHint('1-14', { mode: 'status-badge' })).toBe('Node-1-14-OK');
      expect(formatDisguisedHint('6', { mode: 'codename-word' }, 'Falcon')).toBe('Codename: Falcon');
      expect(formatDisguisedHint('1', { mode: 'pictorial-object', locale: 'de' })).toContain('Hut');
    });

    it('extracts hint from build-version strings', () => {
      const extracted1 = extractHintFromDisguise('Build v1.14', 'build-version');
      expect(extracted1?.hint).toBe('14');
      expect(extracted1?.letter).toBe('N');

      const extracted2 = extractHintFromDisguise('Release v2.14', 'build-version');
      expect(extracted2?.hint).toBe('1-14');
      expect(extracted2?.letter).toBe('N');
    });
  });
});
