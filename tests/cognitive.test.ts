import { describe, it, expect } from 'vitest';
import { encodeRadix26 } from '../src/core/radix26.js';
import {
  applyCognitiveTransformation,
  generateEmergencyResyncSequence,
} from '../src/core/cognitive.js';

describe('Cognitive Transformation Engine', () => {
  const masterPassword = '!!!!!1g0750n17!!!!!';

  it('inserts letter at anchor position (muscle memory anchor 5)', () => {
    // Hint: 14 -> Letter 'N'
    const state = encodeRadix26(13); // index = 14, letter = 'N'
    const transformed = applyCognitiveTransformation(masterPassword, state, {
      type: 'insert-at-anchor',
      anchorIndex: 5,
    });

    // "!!!!!" + "N" + "1g0750n17!!!!!"
    expect(transformed).toBe('!!!!!N1g0750n17!!!!!');
  });

  it('handles prefix transformation', () => {
    const state = encodeRadix26(0); // Letter 'A'
    const transformed = applyCognitiveTransformation(masterPassword, state, {
      type: 'prefix',
    });
    expect(transformed).toBe('A!!!!!1g0750n17!!!!!');
  });

  it('handles suffix transformation', () => {
    const state = encodeRadix26(25); // Letter 'Z'
    const transformed = applyCognitiveTransformation(masterPassword, state, {
      type: 'suffix',
    });
    expect(transformed).toBe('!!!!!1g0750n17!!!!!Z');
  });

  it('handles caesar shift at anchor index', () => {
    // base: 'admin123', anchor=0 ('a'), index=1 -> 'b'
    const state = encodeRadix26(0); // index = 1 ('A')
    const transformed = applyCognitiveTransformation('admin123', state, {
      type: 'caesar-shift',
      anchorIndex: 0,
    });
    expect(transformed).toBe('bdmin123');
  });

  it('generates emergency resynchronization sequence', () => {
    const resync = generateEmergencyResyncSequence(26);
    expect(resync.stateA.counter).toBe(26);
    expect(resync.stateA.hint).toBe('1-1');
    expect(resync.stateB.counter).toBe(27);
    expect(resync.stateB.hint).toBe('1-2');
    expect(resync.resyncToken).toBe('RSYNC-1-1:1-2');
  });
});
