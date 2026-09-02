import { describe, it, expect } from 'vitest';
import { encodeRadix26 } from '../src/core/radix26.js';
import {
  calculateDigitSum,
  calculateDigitalRoot,
  calculateAlternatingDigitSum,
  reverseNumberString,
  calculateSquareRootFloor,
  calculatePowerModulo,
  reverseSegment,
  splitAndConquerSwap,
} from '../src/core/math-operators.js';
import { generate3x3GridMatrix, traverse3x3Grid } from '../src/core/matrix-grid.js';
import { applyCognitiveTransformation } from '../src/core/cognitive.js';
import { StealthAuthServer } from '../src/server/stealth-auth-server.js';
import { StealthAuthClient } from '../src/client/stealth-auth-client.js';
import { InMemoryStorageAdapter } from '../src/server/storage.js';
import { CognitiveRule, CognitiveRecipe } from '../src/types.js';

describe('Combinatorics, Math Operators & Pipeline Engine', () => {
  const masterPassword = '!!!!!1g0750n17!!!!!';

  describe('Mathematical Primitive Functions', () => {
    it('calculates Quersumme (Digit Sum) and Digital Root', () => {
      expect(calculateDigitSum(14)).toBe(5);
      expect(calculateDigitSum(129)).toBe(12);
      expect(calculateDigitalRoot(99)).toBe(9); // 9+9=18 -> 1+8=9
    });

    it('calculates Alternating Digit Sum & Reversed Number Strings', () => {
      expect(calculateAlternatingDigitSum(14)).toBe(3); // |1 - 4| = 3
      expect(reverseNumberString(14)).toBe('41');
      expect(reverseNumberString(1234)).toBe('4321');
    });

    it('calculates Square Root and Power Modulo', () => {
      expect(calculateSquareRootFloor(16)).toBe(4);
      expect(calculateSquareRootFloor(17)).toBe(4);
      expect(calculateSquareRootFloor(25)).toBe(5);

      // 3^2 % 10 = 9
      expect(calculatePowerModulo(3, 2, 10)).toBe(9);
      // 4^3 % 10 = 64 % 10 = 4
      expect(calculatePowerModulo(4, 3, 10)).toBe(4);
    });

    it('executes Segment Reversal and Split-and-Conquer (Bisection Swap)', () => {
      // Reverses first 4 chars: "ABCD1234" -> "DCBA1234"
      expect(reverseSegment('ABCD1234', 0, 4)).toBe('DCBA1234');

      // Bisection swap with explicit pivot 5: "ALPHA" + "BETA" -> "BETA" + "ALPHA"
      expect(splitAndConquerSwap('ALPHABETA', 5)).toBe('BETAALPHA');

      // Default half swap
      expect(splitAndConquerSwap('123456')).toBe('456123');
    });
  });

  describe('3x3 Geometric Matrix Grid Traversal', () => {
    it('generates deterministic 3x3 grid and traverses diagonally, vertically, and horizontally', () => {
      const grid = generate3x3GridMatrix(0, 0);
      expect(grid.length).toBe(3);
      expect(grid[0].length).toBe(3);

      // Main Diagonal: (0,0), (1,1), (2,2)
      const diagMain = traverse3x3Grid(grid, 'diagonal-main');
      expect(diagMain).toBe(`${grid[0][0]}${grid[1][1]}${grid[2][2]}`);

      // Anti Diagonal: (0,2), (1,1), (2,0)
      const diagAnti = traverse3x3Grid(grid, 'diagonal-anti');
      expect(diagAnti).toBe(`${grid[0][2]}${grid[1][1]}${grid[2][0]}`);

      // Vertical Col 1: (0,0), (1,0), (2,0)
      const col1 = traverse3x3Grid(grid, 'col-1');
      expect(col1).toBe(`${grid[0][0]}${grid[1][0]}${grid[2][0]}`);

      // Horizontal Row 1: (0,0), (0,1), (0,2)
      const row1 = traverse3x3Grid(grid, 'row-1');
      expect(row1).toBe(`${grid[0][0]}${grid[0][1]}${grid[0][2]}`);
    });
  });

  describe('Chained Multi-Step Cognitive Recipes (Pipelines)', () => {
    it('executes a 3-step pipeline: Word-Boundary + Quersumme + Segment Reversal', () => {
      // Counter 5 -> Index 6 -> Word "Falcon" (F...n)
      const state = encodeRadix26(5);

      const recipe: CognitiveRecipe = {
        name: 'Falcon-Quersumme-Reversal-Recipe',
        steps: [
          // Step 1: Wrap with first & last char of word: "Falcon" -> "F" + secret + "n"
          { op: 'word-boundary', caseMode: 'as-is' },
          // Step 2: Calculate Quersumme of Counter+1 (5+1 = 6) and insert at anchor 6
          { op: 'digit-sum', anchorIndex: 6 },
          // Step 3: Reverse first 3 characters
          { op: 'reverse-segment', segmentStart: 0, segmentLength: 3 },
        ],
      };

      const rule: CognitiveRule = {
        type: 'pipeline',
        recipe,
      };

      const transformed = applyCognitiveTransformation(masterPassword, state, rule);

      // Step 1: "F" + "!!!!!1g0750n17!!!!!" + "n" = "F!!!!!1g0750n17!!!!!n"
      // Step 2: insert "6" at pos 6 -> "F!!!!!" + "6" + "1g0750n17!!!!!n"
      // Step 3: reverse first 3 chars ("F!!") -> "!!F" -> "!!F!!!61g0750n17!!!!!n"
      expect(transformed).toBe('!!F!!!61g0750n17!!!!!n');
    });

    it('executes 3x3 Grid Diagonal Traversal inside a Pipeline', () => {
      const state = encodeRadix26(0);
      const recipe: CognitiveRecipe = {
        name: 'Matrix-Diagonal-Recipe',
        steps: [
          { op: 'grid-matrix-traverse', gridPath: 'diagonal-main', anchorIndex: 5 },
        ],
      };

      const rule: CognitiveRule = {
        type: 'pipeline',
        recipe,
      };

      const diagKey = traverse3x3Grid(state.gridMatrix!, 'diagonal-main');
      const transformed = applyCognitiveTransformation(masterPassword, state, rule);

      expect(transformed).toBe(`!!!!!${diagKey}1g0750n17!!!!!`);
    });
  });

  describe('Full End-to-End Enterprise Auth with Custom Pipeline', () => {
    it('authenticates successfully with a multi-operator combinatorics recipe', async () => {
      const storage = new InMemoryStorageAdapter();
      const server = new StealthAuthServer(storage);

      const customRecipe: CognitiveRecipe = {
        name: 'Math-Power-SquareRoot-Recipe',
        steps: [
          // Step 1: Insert square root floor of index at pos 5
          { op: 'square-root-floor', anchorIndex: 5 },
          // Step 2: Suffix with power modulo (index^2 % 10)
          { op: 'power-modulo', exponent: 2, modulo: 10, anchorIndex: 999 },
        ],
      };

      const rule: CognitiveRule = {
        type: 'pipeline',
        recipe: customRecipe,
      };

      // Counter 15 -> Index 16: sqrt(16) = 4, 16^2 % 10 = 256 % 10 = 6
      await server.registerUser('quant@hedgefund.ny', masterPassword, rule, 15);

      const challenge = await server.createChallenge('quant@hedgefund.ny', {
        mode: 'build-version',
      });

      const transformed = StealthAuthClient.transformPassword(
        masterPassword,
        challenge.hint,
        rule
      );

      // "!!!!!" + "4" + "1g0750n17!!!!!" + "6"
      expect(transformed).toBe('!!!!!41g0750n17!!!!!6');

      const authPayload = StealthAuthClient.createAuthResponse(transformed, challenge);
      const result = await server.verifyResponse(authPayload);

      expect(result.success).toBe(true);
      expect(result.verifiedCounter).toBe(15);
    });
  });
});
