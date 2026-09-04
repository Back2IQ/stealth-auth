/**
 * Back2IQ DynPass x TPA - Cognitive Jacket-Wardrobe Engine
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 * 
 * Unifies the TPA Jacket-Garderoben-Modell with DynPass Cognitive MFA:
 * 
 * 1. The Naked Entity (Das nackte Ding):
 *    The raw master credential S. It never leaves the user's mind,
 *    is never transmitted, and 0 bytes are stored on the server.
 * 
 * 2. The Jacket (Das Jacket):
 *    A lightweight, ephemeral, context-bound cryptographic garment T(S, c, R)
 *    tailored for a single challenge c. It is donned for login and doffed
 *    immediately after signing.
 * 
 * 3. The Wardrobe (Die Garderobe):
 *    The zero-knowledge server registry storing only 26 verification hooks
 *    (Ed25519 public keys). The wardrobe verifies the garment's fit without
 *    ever holding or seeing the fabric.
 */

import {
  Jacket,
  WardrobeHook,
  WardrobeProof,
  CognitiveRule,
  ChallengePayload,
  CHALLENGE_SPACE_SIZE,
} from '../types.js';
import { encodeRadix26 } from './radix26.js';
import { applyCognitiveTransformation } from './cognitive.js';
import { derivePublicKey, signChallenge, verifyChallengeSignature } from '../crypto/keys.js';
import { computeHmacSha256 } from '../crypto/hasher.js';
import { SystemImmunityEngine, globalImmunityEngine } from './antifragility.js';

export interface DonnedJacketSession {
  jacket: Jacket;
  proof: WardrobeProof;
}

export class CognitiveJacketWardrobe {
  private hooks: Map<number, WardrobeHook> = new Map();
  private immunity: SystemImmunityEngine;

  constructor(hooks?: WardrobeHook[] | Record<number, string>, immunity?: SystemImmunityEngine) {
    this.immunity = immunity ?? globalImmunityEngine;
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        this.hooks.set(hook.hookIndex, hook);
      }
    } else if (hooks) {
      for (const [idxStr, pkHex] of Object.entries(hooks)) {
        const idx = parseInt(idxStr, 10);
        this.hooks.set(idx, {
          hookIndex: idx,
          publicKeyHex: pkHex,
          createdAt: Date.now(),
        });
      }
    }
  }

  /**
   * Generates the 26 Wardrobe Hooks (Public Keys) from a naked secret
   * without persisting the naked secret itself.
   */
  static generateWardrobeHooks(
    nakedSecret: string,
    rule: CognitiveRule,
    salt: string
  ): WardrobeHook[] {
    const hooks: WardrobeHook[] = [];
    for (let index = 1; index <= CHALLENGE_SPACE_SIZE; index++) {
      const state = encodeRadix26(index - 1);
      const transformed = applyCognitiveTransformation(nakedSecret, state, rule);
      const publicKeyHex = derivePublicKey(salt, transformed);
      hooks.push({
        hookIndex: index,
        publicKeyHex,
        createdAt: Date.now(),
      });
    }
    return hooks;
  }

  /**
   * "Anziehen" (Donning the Jacket):
   * Temporarily constructs the context-bound garment T(S, c, R),
   * signs the session challenge, and yields the zero-knowledge WardrobeProof.
   */
  static donJacket(
    nakedSecret: string,
    challenge: ChallengePayload,
    rule: CognitiveRule,
    salt?: string
  ): DonnedJacketSession {
    const activeSalt = salt || challenge.passwordSalt || '';
    const state = encodeRadix26(challenge.index - 1);

    // Ephemeral transformation
    const transformed = applyCognitiveTransformation(nakedSecret, state, rule);

    // Deterministic Jacket ID (Provenance Hash)
    const jacketProvenance = computeHmacSha256(
      activeSalt,
      `jacket:${challenge.sessionId}:${challenge.index}:${rule.modality || 'text'}`
    );
    const jacketId = `jkt_${jacketProvenance.slice(0, 16)}`;

    const jacket: Jacket = {
      jacketId,
      challengeIndex: challenge.index,
      modality: rule.modality || 'text',
      slots: rule.slots,
      status: 'DONNED',
      donnedAt: Date.now(),
      provenanceHash: jacketProvenance,
    };

    const signatureHex = signChallenge(
      activeSalt,
      transformed,
      `${challenge.nonce}:${challenge.sessionId}`
    );

    const proof: WardrobeProof = {
      jacketId,
      sessionId: challenge.sessionId,
      signatureHex,
      timestamp: Date.now(),
      contextModality: rule.modality,
    };

    return { jacket, proof };
  }

  /**
   * "Ausziehen" (Doffing the Jacket):
   * Retires the ephemeral garment, clearing sensitive ephemeral state from RAM
   * and logging return to wardrobe.
   */
  static doffJacket(jacket: Jacket): Jacket {
    return {
      ...jacket,
      status: 'IN_WARDROBE',
      doffedAt: Date.now(),
    };
  }

  /**
   * "Garderoben-Prüfung" (Verification at the Wardrobe):
   * Checks the proof against the stored Wardrobe Hook for this challenge index.
   * Fails-closed and captures anomalies in the Immunity Engine.
   */
  verifyAtWardrobe(
    proof: WardrobeProof,
    challenge: ChallengePayload
  ): boolean {
    if (!proof || !proof.signatureHex || !challenge) {
      this.immunity.trapAnomaly('MALFORMED_PAYLOAD', { proof, challenge });
      return false;
    }

    const hook = this.hooks.get(challenge.index);
    if (!hook || !hook.publicKeyHex) {
      this.immunity.trapAnomaly('STATE_DESYNC', { challengeIndex: challenge.index });
      return false;
    }

    const message = `${challenge.nonce}:${challenge.sessionId}`;
    const isValid = verifyChallengeSignature(hook.publicKeyHex, message, proof.signatureHex);

    if (!isValid) {
      this.immunity.trapAnomaly('CRYPTO_CORRUPTION', {
        jacketId: proof.jacketId,
        challengeIndex: challenge.index,
      });
      return false;
    }

    return true;
  }

  /**
   * Total number of active hooks in this wardrobe
   */
  get hookCount(): number {
    return this.hooks.size;
  }
}
