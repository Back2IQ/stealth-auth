/**
 * Back2IQ StealthAuth - Enterprise Server Engine & Verifier
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import {
  StealthAuthServerConfig,
  IStorageAdapter,
  ChallengePayload,
  AuthResponsePayload,
  AuthVerificationResult,
  UserAuthRecord,
  ActiveSessionRecord,
  CognitiveRule,
  DisguiseConfig,
} from '../types.js';
import { encodeRadix26, formatDisguisedHint } from '../core/radix26.js';
import { applyCognitiveTransformation } from '../core/cognitive.js';
import { generateCandidateWindow } from '../core/state-engine.js';
import {
  generateSecureNonce,
  generateSessionId,
  computeClientResponseHash,
  constantTimeCompare,
  computeHmacSha256,
} from '../crypto/hasher.js';
import { InMemoryStorageAdapter } from './storage.js';

export class StealthAuthServer {
  private storage: IStorageAdapter;
  private config: Required<StealthAuthServerConfig>;
  private masterVault: Map<string, string> = new Map();

  constructor(
    storage?: IStorageAdapter,
    config: StealthAuthServerConfig = {}
  ) {
    this.storage = storage ?? new InMemoryStorageAdapter();
    this.config = {
      lookaheadWindowForward: config.lookaheadWindowForward ?? 3,
      lookbackWindowBackward: config.lookbackWindowBackward ?? 1,
      sessionTtlSeconds: config.sessionTtlSeconds ?? 180,
      maxFailedAttempts: config.maxFailedAttempts ?? 5,
      lockoutDurationSeconds: config.lockoutDurationSeconds ?? 300,
      defaultDisguise: config.defaultDisguise ?? { mode: 'build-version' },
      jwtSecret: config.jwtSecret ?? generateSecureNonce(32),
    };
  }

  async registerUser(
    userId: string,
    masterPassword: string,
    cognitiveRule: CognitiveRule,
    initialCounter = 0
  ): Promise<{ userId: string; initialCounter: number }> {
    if (!userId || !masterPassword) {
      throw new Error('UserId and MasterPassword are required');
    }

    const salt = generateSecureNonce(16);
    this.masterVault.set(userId, masterPassword);

    const userRecord: UserAuthRecord = {
      userId,
      counter: initialCounter,
      passwordSalt: salt,
      cognitiveRule,
      baseSecretSalt: salt,
      masterVerifierHash: computeHmacSha256(salt, masterPassword),
      failedAttempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.storage.saveUser(userRecord);
    return { userId, initialCounter };
  }

  async createChallenge(
    userId: string,
    disguiseConfig?: DisguiseConfig
  ): Promise<ChallengePayload> {
    const user = await this.storage.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      const remainingSeconds = Math.ceil((user.lockedUntil - Date.now()) / 1000);
      throw new Error(`Account locked due to excessive failed attempts. Try again in ${remainingSeconds}s.`);
    }

    const state = encodeRadix26(user.counter);
    const activeDisguise = disguiseConfig ?? this.config.defaultDisguise;
    const disguisedHint = formatDisguisedHint(
      state.hint,
      activeDisguise,
      state.wordHint,
      state.objectHint,
      state.captchaToken,
      state.gridMatrix
    );

    const sessionId = generateSessionId();
    const nonce = generateSecureNonce(32);
    const expiresAt = Date.now() + this.config.sessionTtlSeconds * 1000;

    const sessionRecord: ActiveSessionRecord = {
      sessionId,
      userId,
      expectedCounter: user.counter,
      nonce,
      createdAt: Date.now(),
      expiresAt,
    };

    await this.storage.createSession(sessionRecord);

    return {
      sessionId,
      userId,
      hint: state.hint,
      wordHint: state.wordHint,
      objectHint: state.objectHint,
      captchaToken: state.captchaToken,
      gridMatrix: state.gridMatrix,
      disguisedHint,
      nonce,
      expiresAt,
      cycle: state.cycle,
      index: state.index,
    };
  }

  async verifyResponse(
    payload: AuthResponsePayload
  ): Promise<AuthVerificationResult> {
    const { sessionId, responseHash } = payload;

    const session = await this.storage.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'SESSION_EXPIRED_OR_INVALID',
      };
    }

    await this.storage.deleteSession(sessionId);

    const user = await this.storage.getUser(session.userId);
    if (!user) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
      };
    }

    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      return {
        success: false,
        error: 'ACCOUNT_LOCKED',
      };
    }

    const masterPassword = this.masterVault.get(user.userId);
    if (!masterPassword) {
      return {
        success: false,
        error: 'CREDENTIAL_VAULT_UNAVAILABLE',
      };
    }

    const candidates = generateCandidateWindow(session.expectedCounter, {
      lookforwardWindow: this.config.lookaheadWindowForward,
      lookbackwardWindow: this.config.lookbackWindowBackward,
    });

    let matchedCandidate: (typeof candidates)[0] | null = null;

    for (const candidate of candidates) {
      const candidateTransformed = applyCognitiveTransformation(
        masterPassword,
        candidate.state,
        user.cognitiveRule
      );

      const expectedResponseHash = computeClientResponseHash(
        candidateTransformed,
        session.nonce,
        session.sessionId
      );

      if (constantTimeCompare(expectedResponseHash, responseHash)) {
        matchedCandidate = candidate;
        break;
      }
    }

    if (matchedCandidate) {
      const nextCounter = matchedCandidate.counter + 1;
      await this.storage.updateUserCounter(user.userId, nextCounter);

      const authToken = this.generateAuthToken(user.userId, nextCounter);

      return {
        success: true,
        userId: user.userId,
        verifiedCounter: matchedCandidate.counter,
        resynced: matchedCandidate.delta !== 0,
        delta: matchedCandidate.delta,
        authToken,
      };
    }

    const newFailedCount = (user.failedAttempts || 0) + 1;
    let lockedUntil: number | undefined;

    if (newFailedCount >= this.config.maxFailedAttempts) {
      lockedUntil = Date.now() + this.config.lockoutDurationSeconds * 1000;
    }

    await this.storage.updateUserFailedAttempts(user.userId, newFailedCount, lockedUntil);

    return {
      success: false,
      error: lockedUntil ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
    };
  }

  private generateAuthToken(userId: string, currentCounter: number): string {
    const payload = {
      sub: userId,
      counter: currentCounter,
      iss: 'back2iq-stealthauth',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const header = { alg: 'HS256', typ: 'JWT' };
    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = computeHmacSha256(this.config.jwtSecret, `${b64Header}.${b64Payload}`);
    const b64Sig = Buffer.from(signature, 'hex').toString('base64url');

    return `${b64Header}.${b64Payload}.${b64Sig}`;
  }
}
