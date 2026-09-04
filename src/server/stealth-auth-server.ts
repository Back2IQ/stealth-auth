/**
 * Back2IQ DynPass - Enterprise Server Engine & Verifier
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 *
 * The server draws a random challenge from a fixed space of 26 values and checks
 * the answer against the Ed25519 public key stored for that value. It holds no
 * master password, no cognitive rule and no per-login counter: there is nothing
 * to desynchronize, nothing to exhaust, and nothing in the database that could
 * answer a challenge.
 */

import {
  DynPassServerConfig,
  StealthAuthServerConfig,
  IStorageAdapter,
  ChallengePayload,
  AuthResponsePayload,
  AuthVerificationResult,
  AuthErrorCode,
  UserAuthRecord,
  ActiveSessionRecord,
  CognitiveRule,
  DisguiseConfig,
  CHALLENGE_SPACE_SIZE,
} from '../types.js';
import { encodeRadix26, formatDisguisedHint } from '../core/radix26.js';
import { buildPublicKeyTable } from '../core/key-table.js';
import { getPersonalQuestionForIndex } from '../core/personal-questions.js';
import { verifyChallengeSignature } from '../crypto/keys.js';
import {
  generateSecureNonce,
  generateSessionId,
  computeHmacSha256,
  drawRandomInt,
} from '../crypto/hasher.js';
import { InMemoryStorageAdapter } from './storage.js';

const SALT_HEX_LENGTH = 32;

function messageFor(error: AuthErrorCode, retryAfterSeconds?: number): string {
  switch (error) {
    case 'SESSION_EXPIRED_OR_INVALID':
      return 'This challenge was already used or has expired. Request a new one and try again.';
    case 'ACCOUNT_LOCKED':
      return `Too many failed attempts. You can try again in ${retryAfterSeconds} seconds.`;
    case 'INVALID_CREDENTIALS':
    default:
      return 'That answer did not match the challenge shown. Check the challenge and try again.';
  }
}

export class DynPassServer {
  private storage: IStorageAdapter;
  private config: Required<DynPassServerConfig>;

  constructor(storage?: IStorageAdapter, config: DynPassServerConfig = {}) {
    this.storage = storage ?? new InMemoryStorageAdapter();
    this.config = {
      sessionTtlSeconds: config.sessionTtlSeconds ?? 180,
      maxFailedAttempts: config.maxFailedAttempts ?? 5,
      lockoutDurationSeconds: config.lockoutDurationSeconds ?? 300,
      defaultDisguise: config.defaultDisguise ?? { mode: 'build-version' },
      jwtSecret: config.jwtSecret ?? generateSecureNonce(32),
    };
  }

  /**
   * Registers a user from either a master password (key table built here, the
   * password discarded immediately) or a table the client precomputed, in which
   * case the password never reaches the server at all.
   */
  async registerUser(
    userId: string,
    masterPasswordOrTable: string | Record<number, string>,
    cognitiveRule: CognitiveRule,
    customSalt?: string
  ): Promise<{ userId: string }> {
    if (!userId) {
      throw new Error('UserId is required');
    }

    const salt = customSalt ?? generateSecureNonce(16);
    const publicKeyTable =
      typeof masterPasswordOrTable === 'string'
        ? buildPublicKeyTable(masterPasswordOrTable, cognitiveRule, salt)
        : masterPasswordOrTable;

    const userRecord: UserAuthRecord = {
      userId,
      passwordSalt: salt,
      publicKeyTable,
      modality: cognitiveRule.modality,
      countersign: cognitiveRule.countersign,
      failedAttempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.storage.saveUser(userRecord);
    return { userId };
  }

  /**
   * Draws a challenge and returns it in its disguised UI form.
   *
   * Unknown and locked accounts receive an ordinary-looking challenge too, so
   * that this endpoint cannot be used to discover which accounts exist or which
   * are currently locked. Both are reported at verification time instead.
   */
  async createChallenge(
    userId: string,
    disguiseConfig?: DisguiseConfig
  ): Promise<ChallengePayload> {
    const user = await this.storage.getUser(userId);
    const challengeIndex = drawRandomInt(1, CHALLENGE_SPACE_SIZE);
    const state = encodeRadix26(challengeIndex - 1);
    
    // Determine effective disguise mode from user preference if not explicitly overridden
    let activeDisguise = disguiseConfig ?? this.config.defaultDisguise;
    if (!disguiseConfig && user?.modality) {
      if (user.modality === 'text') activeDisguise = { mode: 'codename-word' };
      else if (user.modality === 'image') activeDisguise = { mode: 'pictorial-object' };
      else if (user.modality === 'audio') activeDisguise = { mode: 'spoken-audio' };
      else if (user.modality === 'personal-questions') activeDisguise = { mode: 'personal-questions' };
    }

    const questionHint = (user?.modality === 'personal-questions' || activeDisguise.mode === 'personal-questions')
      ? getPersonalQuestionForIndex(challengeIndex)
      : undefined;

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
      challengeIndex,
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
      questionHint,
      spokenAudioWord: state.wordHint,
      modality: user?.modality,
      countersign: user?.countersign,
      captchaToken: state.captchaToken,
      gridMatrix: state.gridMatrix,
      disguisedHint,
      nonce,
      passwordSalt: user ? user.passwordSalt : this.decoySalt(userId),
      expiresAt,
      index: challengeIndex,
    };
  }

  /** Checks the signature against the public key stored for this challenge. */
  async verifyResponse(payload: AuthResponsePayload): Promise<AuthVerificationResult> {
    const { sessionId, responseHash } = payload;

    const session = await this.storage.getSession(sessionId);
    if (!session) {
      return this.failure('SESSION_EXPIRED_OR_INVALID');
    }

    await this.storage.deleteSession(sessionId);

    const user = await this.storage.getUser(session.userId);
    if (!user) {
      return this.failure('INVALID_CREDENTIALS');
    }

    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      const retryAfterSeconds = Math.ceil((user.lockedUntil - Date.now()) / 1000);
      return this.failure('ACCOUNT_LOCKED', retryAfterSeconds);
    }

    const publicKey = user.publicKeyTable[session.challengeIndex];
    const signatureValid =
      !!publicKey &&
      verifyChallengeSignature(publicKey, `${session.nonce}:${session.sessionId}`, responseHash);

    if (signatureValid) {
      await this.storage.updateUserFailedAttempts(user.userId, 0, undefined);

      return {
        success: true,
        userId: user.userId,
        challengeIndex: session.challengeIndex,
        authToken: this.generateAuthToken(user.userId),
      };
    }

    const newFailedCount = (user.failedAttempts || 0) + 1;
    const locked = newFailedCount >= this.config.maxFailedAttempts;
    const lockedUntil = locked
      ? Date.now() + this.config.lockoutDurationSeconds * 1000
      : undefined;

    await this.storage.updateUserFailedAttempts(user.userId, newFailedCount, lockedUntil);

    return locked
      ? this.failure('ACCOUNT_LOCKED', this.config.lockoutDurationSeconds)
      : this.failure('INVALID_CREDENTIALS');
  }

  private failure(error: AuthErrorCode, retryAfterSeconds?: number): AuthVerificationResult {
    return {
      success: false,
      error,
      message: messageFor(error, retryAfterSeconds),
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    };
  }

  /** Stable, plausible salt for an account that does not exist. */
  private decoySalt(userId: string): string {
    return computeHmacSha256(this.config.jwtSecret, `decoy:${userId}`).slice(0, SALT_HEX_LENGTH);
  }

  private generateAuthToken(userId: string): string {
    const payload = {
      sub: userId,
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

export { DynPassServer as StealthAuthServer };

