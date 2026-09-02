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
  /** 3x3 or 4x4 Grid Matrix representation for geometric traversal */
  gridMatrix?: string[][];
}

export interface VisualObjectHint {
  objectId: string;
  iconSvg?: string;
  localizedNames: Record<SupportedLocale, string>;
}

export type GridTraversalPath = 
  | 'diagonal-main'          // Top-left to bottom-right (e.g. (0,0), (1,1), (2,2))
  | 'diagonal-anti'          // Top-right to bottom-left (e.g. (0,2), (1,1), (2,0))
  | 'row-1' | 'row-2' | 'row-3'
  | 'col-1' | 'col-2' | 'col-3'
  | 'cross-center'           // Center row + center col intersection
  | 'perimeter-clockwise'    // Outer perimeter
  | 'zigzag-horizontal'
  | 'zigzag-vertical';

export type MathOperatorType = 
  | 'digit-sum'              // Quersumme: Q(14) = 5
  | 'digital-root'           // Einstellige Quersumme: Q(99) = 18 -> 9
  | 'digit-sum-reverse'      // Quersumme gespiegelt: "14" -> "41" -> 4+1 = 5 oder String "41"
  | 'alternating-digit-sum'  // Alternierende Quersumme: 1-4 = -3 -> 3
  | 'square-root-floor'      // floor(sqrt(Index)) e.g. sqrt(16) = 4
  | 'power-modulo'           // (Index^power) % modulo
  | 'reverse-segment'        // Spiegeln/Umdrehen eines Teilbereichs
  | 'split-and-conquer'      // Bisektion / Teile-und-Herrsche Blöcke
  | 'grid-matrix-traverse'   // 3x3 Geometrischer Pfad (Diagonal / Vertikal / Horizontal)
  | 'word-boundary'          // Erster + Letzter Buchstabe
  | 'pictorial-object'       // Bild/Icon in Benutzersprache
  | 'pseudo-captcha'         // Anti-Bot Token Randzeichen
  | 'insert-at-anchor'       // Radix-26 Buchstabe an Anker
  | 'prefix'
  | 'suffix'
  | 'caesar-shift'
  | 'custom';

export interface PipelineStep {
  op: MathOperatorType;
  /** Anchor index (0-indexed) */
  anchorIndex?: number;
  /** Secondary anchor index for multi-anchor splits */
  anchorIndex2?: number;
  /** Start and length for segment operations */
  segmentStart?: number;
  segmentLength?: number;
  /** Power exponent (default: 2) */
  exponent?: number;
  /** Modulo divider (default: 10 or 26) */
  modulo?: number;
  /** Grid traversal path for geometric 3x3 challenges */
  gridPath?: GridTraversalPath;
  /** User configured cognitive language */
  locale?: SupportedLocale;
  /** Case preservation mode */
  caseMode?: 'upper' | 'lower' | 'first-upper-last-lower' | 'as-is';
  /** Custom transformation function */
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
  /** Multi-step combinatorics pipeline */
  recipe?: CognitiveRecipe;
  customTransform?: (baseSecret: string, state: Radix26State) => string;
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

export interface UserAuthRecord {
  userId: string;
  counter: number;
  passwordSalt: string;
  cognitiveRule: CognitiveRule;
  baseSecretSalt: string;
  masterVerifierHash: string;
  failedAttempts: number;
  lockedUntil?: number;
  createdAt: number;
  updatedAt: number;
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
  defaultDisguiseMode?: DisguiseMode;
  defaultLocale?: SupportedLocale;
}
