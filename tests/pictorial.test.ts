import { describe, it, expect } from 'vitest';
import { encodeRadix26 } from '../src/core/radix26.js';
import { applyCognitiveTransformation } from '../src/core/cognitive.js';
import { StealthAuthServer } from '../src/server/stealth-auth-server.js';
import { StealthAuthClient } from '../src/client/stealth-auth-client.js';
import { InMemoryStorageAdapter } from '../src/server/storage.js';
import { CognitiveRule } from '../src/types.js';

describe('Pictorial Object & Pseudo-CAPTCHA Cognitive Modes', () => {
  const masterPassword = '!!!!!1g0750n17!!!!!';

  describe('Visual Object Recognition (e.g. "Hut" / "Auto")', () => {
    it('transforms "Hut" into H...t in German locale', () => {
      // Counter 0 -> Object "hat" -> DE name "Hut"
      const state = encodeRadix26(0);
      expect(state.objectHint?.objectId).toBe('hat');
      expect(state.objectHint?.localizedNames.de).toBe('Hut');

      const deRule: CognitiveRule = {
        type: 'pictorial-object',
        locale: 'de',
        caseMode: 'first-upper-last-lower',
      };

      const transformed = applyCognitiveTransformation(masterPassword, state, deRule);
      // 'H' + "!!!!!1g0750n17!!!!!" + 't'
      expect(transformed).toBe('H!!!!!1g0750n17!!!!!t');
    });

    it('transforms "Auto" (DE) into A...o vs "Car" (EN) into C...r for multi-language secrecy', () => {
      // Counter 1 -> Object "car"
      const state = encodeRadix26(1);
      expect(state.objectHint?.objectId).toBe('car');

      const deRule: CognitiveRule = {
        type: 'pictorial-object',
        locale: 'de',
      };
      expect(applyCognitiveTransformation(masterPassword, state, deRule)).toBe('A!!!!!1g0750n17!!!!!o');

      const enRule: CognitiveRule = {
        type: 'pictorial-object',
        locale: 'en',
      };
      expect(applyCognitiveTransformation(masterPassword, state, enRule)).toBe('C!!!!!1g0750n17!!!!!r');

      const trRule: CognitiveRule = {
        type: 'pictorial-object',
        locale: 'tr',
      }; // "Araba" -> A...a
      expect(applyCognitiveTransformation(masterPassword, state, trRule)).toBe('A!!!!!1g0750n17!!!!!a');
    });
  });

  describe('Pseudo-CAPTCHA Obfuscation Mode', () => {
    it('extracts first and last char of pseudo-CAPTCHA badge', () => {
      const state = encodeRadix26(0);
      expect(state.captchaToken).toBeDefined();

      const captchaRule: CognitiveRule = {
        type: 'pseudo-captcha',
      };

      const transformed = applyCognitiveTransformation(masterPassword, state, captchaRule);
      const token = state.captchaToken!;
      const expected = `${token[0]}${masterPassword}${token[token.length - 1]}`;
      expect(transformed).toBe(expected);
    });
  });

  describe('Full Server & Client Pictorial Flow', () => {
    it('authenticates successfully with localized visual object challenge', async () => {
      const storage = new InMemoryStorageAdapter();
      const server = new StealthAuthServer(storage);

      const rule: CognitiveRule = {
        type: 'pictorial-object',
        locale: 'de',
      };

      await server.registerUser('doctor@cleanroom-fab.de', masterPassword, rule, 0);

      // Server generates pictorial challenge
      const challenge = await server.createChallenge('doctor@cleanroom-fab.de', {
        mode: 'pictorial-object',
        locale: 'de',
      });

      expect(challenge.objectHint?.objectId).toBe('hat');
      expect(challenge.disguisedHint).toContain('Hut');

      // User identifies "Hut" -> enters 'H' + master + 't'
      const transformed = StealthAuthClient.transformPassword(
        masterPassword,
        challenge.hint,
        rule
      );
      expect(transformed).toBe('H!!!!!1g0750n17!!!!!t');

      const authPayload = StealthAuthClient.createAuthResponse(transformed, challenge);
      const result = await server.verifyResponse(authPayload);

      expect(result.success).toBe(true);
      expect(result.verifiedCounter).toBe(0);
    });
  });
});
