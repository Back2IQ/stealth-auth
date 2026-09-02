/**
 * Back2IQ StealthAuth - Types & Combinatorics Matrix Interface Definitions
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

export type SupportedLocale = 'de' | 'en' | 'tr' | 'fr' | 'es';

export interface Radix26State {
  counter: number;
  cycle: number;
  index: number;
  letter: string;
  hint: string;
  wordHint?: string;
  objectHint?: VisualObjectHint;
  captchaToken?: string;
  gridMatrix?: string[][];
}

export interface VisualObjectHint {
  objectId: string;
  iconSvg?: string;
  localizedNames: Record<SupportedLocale, string>;
}

export type GridTraversalPath = 
  | 'diagonal-main'
  | 'diagonal-anti'
  | 'row-1' | 'row-2' | 'row-3'
  | 'col-1' | 'col-2' | 'col-3'
  | 'cross-center'
  | 'perimeter-clockwise'
  | 'zigzag-horizontal'
  | 'zigzag-vertical';

export type MathOperatorType = 
  | 'digit-sum'
  | 'digital-root'
  | 'digit-sum-reverse'
  | 'alternating-digit-sum'
  | 'square-root-floor'
  | 'power-modulo'
  | 'reverse-segment'
  | 'split-and-conquer'
  | 'grid-matrix-traverse'
  | 'word-boundary'
  | 'pictorial-object'
  | 'pseudo-captcha'
  | 'insert-at-anchor'
  | 'prefix'
  | 'suffix'
  | 'caesar-shift'
  | 'custom';

export interface PipelineStep {
  op: MathOperatorType;
  anchorIndex?: number;
  anchorIndex2?: number;
  segmentStart?: number;
  segmentLength?: number;
  exponent?: number;
  modulo?: number;
  gridPath?: GridTraversalPath;
  locale?: SupportedLocale;
  caseMode?: 'upper' | 'lower' | 'first-upper-last-lower' | 'as-is';
  customTransform?: (currentSecret: string, state: Radix26State) => string;
}

export interface CognitiveRecipe {
  name: string;
  description?: string;
  steps: PipelineStep[];
}

export type TransformationType = MathOperatorType | 'pipeline';

export interface CognitiveRule {
  type: TransformationType;
  anchorIndex?: number;
  anchorIndex2?: number;
  locale?: SupportedLocale;
  caseMode?: 'upper' | 'lower' | 'first-upper-last-lower' | 'as-is';
  gridPath?: GridTraversalPath;
  exponent?: number;
  modulo?: number;
  recipe?: CognitiveRecipe;
  customTransform?: (baseSecret: string, state: Radix26State) => string;
}

export interface UserAuthRecord {
  userId: string;
  counter: number;
  passwordSalt: string;
  cognitiveRule: CognitiveRule;
  /** Server stores ONLY salted precomputed verifier hashes, NEVER plaintext password */
  verifierTable: Map<number, string> | Record<number, string>;
  failedAttempts: number;
  lockedUntil?: number;
  createdAt: number;
  updatedAt: number;
}

export type DisguiseMode = 
  | 'build-version' 
  | 'session-ticket' 
  | 'patch-id' 
  | 'status-badge' 
  | 'codename-word' 
  | 'pictorial-object' 
  | 'pseudo-captcha' 
  | 'grid-matrix-3x3' 
  | 'raw' 
  | 'custom';

export interface DisguiseConfig {
  mode: DisguiseMode;
  locale?: SupportedLocale;
  customTemplate?: string;
}

export interface ChallengePayload {
  sessionId: string;
  userId: string;
  hint: string;
  wordHint?: string;
  objectHint?: VisualObjectHint;
  captchaToken?: string;
  gridMatrix?: string[][];
  disguisedHint: string;
  nonce: string;
  passwordSalt?: string;
  expiresAt: number;
  cycle: number;
  index: number;
}

export interface AuthResponsePayload {
  sessionId: string;
  responseHash: string;
  clientTimestamp: number;
}

export interface AuthVerificationResult {
  success: boolean;
  userId?: string;
  verifiedCounter?: number;
  resynced?: boolean;
  delta?: number;
  error?: string;
  authToken?: string;
}

export interface ActiveSessionRecord {
  sessionId: string;
  userId: string;
  expectedCounter: number;
  nonce: string;
  createdAt: number;
  expiresAt: number;
}

export interface IStorageAdapter {
  getUser(userId: string): Promise<UserAuthRecord | null>;
  saveUser(user: UserAuthRecord): Promise<void>;
  updateUserCounter(userId: string, newCounter: number): Promise<void>;
  updateUserFailedAttempts(userId: string, failedAttempts: number, lockedUntil?: number): Promise<void>;
  
  createSession(session: ActiveSessionRecord): Promise<void>;
  getSession(sessionId: string): Promise<ActiveSessionRecord | null>;
  deleteSession(sessionId: string): Promise<void>;
}

export interface StealthAuthServerConfig {
  lookaheadWindowForward?: number;
  lookbackWindowBackward?: number;
  sessionTtlSeconds?: number;
  maxFailedAttempts?: number;
  lockoutDurationSeconds?: number;
  defaultDisguise?: DisguiseConfig;
  jwtSecret?: string;
}

export interface StealthAuthClientConfig {
  defaultDisguiseMode?: DisguiseConfig['mode'];
  defaultLocale?: SupportedLocale;
}
