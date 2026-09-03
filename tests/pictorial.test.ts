import { describe, it, expect } from 'vitest';
import { encodeRadix26, formatDisguisedHint } from '../src/core/radix26.js';
import { getVisualObjectForState } from '../src/core/pictorial.js';
import { applyCognitiveTransformation } from '../src/core/cognitive.js';
import { StealthAuthServer } from '../src/server/stealth-auth-server.js';
import { StealthAuthClient } from '../src/client/stealth-auth-client.js';
import { InMemoryStorageAdapter } from '../src/server/storage.js';
import { CognitiveRule, SupportedLocale } from '../src/types.js';

describe('Pictorial Object & Pseudo-CAPTCHA Cognitive Modes', () => {
  const masterPassword = '!!!!!1g0750n17!!!!!';

  describe('Language Factor Integrity', () => {
    it('gives all 26 challenge values a distinct object', () => {
      const ids = new Set<string>();
      for (let index = 1; index <= 26; index++) {
        ids.add(getVisualObjectForState(index).objectId);
      }
      expect(ids.size).toBe(26);
    });

    it('renders the challenge without naming the object in any language', () => {
      const locales: SupportedLocale[] = ['de', 'en', 'tr', 'fr', 'es'];

      for (let index = 1; index <= 26; index++) {
        const object = getVisualObjectForState(index);
        const rendered = formatDisguisedHint(String(index), { mode: 'pictorial-object', locale: 'de' }, undefined, object);

        // Neither the internal id nor any localized name may leak into the UI text:
        // the user is supposed to name the icon in their own language.
        expect(rendered.toLowerCase()).not.toContain(object.objectId.toLowerCase());
        for (const locale of locales) {
          expect(rendered.toLowerCase()).not.toContain(object.localizedNames[locale].toLowerCase());
        }
      }
    });

    it('ships the drawable icon on the challenge payload instead', async () => {
      const server = new StealthAuthServer();
      await server.registerUser('u@corp.de', masterPassword, { type: 'pictorial-object', locale: 'de' });

      const challenge = await server.createChallenge('u@corp.de', { mode: 'pictorial-object', locale: 'de' });
      expect(challenge.objectHint?.iconSvg).toMatch(/^<svg/);
    });
  });

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

      await server.registerUser('doctor@cleanroom-fab.de', masterPassword, rule);

      // Server draws a pictorial challenge; which object comes up is random.
      const challenge = await server.createChallenge('doctor@cleanroom-fab.de', {
        mode: 'pictorial-object',
        locale: 'de',
      });

      const germanName = challenge.objectHint!.localizedNames.de;
      // The UI text names nothing; the icon travels separately and the user
      // supplies the word from their own language.
      expect(challenge.disguisedHint).not.toContain(germanName);
      expect(challenge.objectHint!.iconSvg).toMatch(/^<svg/);

      // User names the object in their locale and wraps the master secret with it
      const transformed = StealthAuthClient.transformPassword(
        masterPassword,
        challenge.hint,
        rule
      );
      expect(transformed).toBe(
        `${germanName[0]}${masterPassword}${germanName[germanName.length - 1]}`
      );

      const authPayload = StealthAuthClient.createAuthResponse(transformed, challenge);
      const result = await server.verifyResponse(authPayload);

      expect(result.success).toBe(true);
      expect(result.challengeIndex).toBe(challenge.index);
    });
  });
});
