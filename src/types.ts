/**
 * Back2IQ StealthAuth - Types & Interface Definitions
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

export type SupportedLocale = 'de' | 'en' | 'tr' | 'fr' | 'es';

export interface Radix26State {
  /** The absolute sequential authentication counter (0, 1, 2, ...) */
  counter: number;
  /** The cycle index C = floor(counter / 26) */
  cycle: number;
  /** The character index I = (counter % 26) + 1 (1 to 26) */
  index: number;
  /** The corresponding cognitive letter L = 'A'..'Z' */
  letter: string;
  /** The standard formatted hint string (e.g., "1".."26", "1-1".."1-26", "2-1"..) */
  hint: string;
  /** Optional deterministic word hint */
  wordHint?: string;
  /** Optional visual object descriptor (for image/icon MFA) */
  objectHint?: VisualObjectHint;
  /** Optional pseudo-captcha token */
  captchaToken?: string;
}

export interface VisualObjectHint {
  objectId: string;        // e.g. 'hat', 'car', 'cat', 'tree', 'sun', 'tiger'
  iconSvg?: string;        // SVG icon or visual representation
  localizedNames: Record<SupportedLocale, string>; // e.g. { de: 'Hut', en: 'Hat', tr: 'Sapka', fr: 'Chapeau', es: 'Sombrero' }
}

export type DisguiseMode = 
  | 'build-version'    // e.g. "Build v1.14" or "Release 2.1"
  | 'session-ticket'   // e.g. "Session #1-14" or "Ticket #14"
  | 'patch-id'         // e.g. "SEC-PATCH-1-14"
  | 'status-badge'     // e.g. "Node-1.14-OK"
  | 'codename-word'    // e.g. "Host: Falcon" or "Release: Vanguard"
  | 'pictorial-object' // e.g. Visual Icon / Photo of "Hut", "Auto", "Katze"
  | 'pseudo-captcha'   // e.g. Noisy alphanumeric CAPTCHA badge "X79kmP"
  | 'raw'
  | 'custom';

export interface DisguiseConfig {
  mode: DisguiseMode;
  locale?: SupportedLocale; // User's cognitive native language (default: 'de')
  customTemplate?: string;
}

export type TransformationType = 
  | 'insert-at-anchor' // Insert letter at specific muscle-memory position
  | 'prefix'           // Prepend letter to master password
  | 'suffix'           // Append letter to master password
  | 'word-boundary'    // First char as prefix, last char as suffix
  | 'pictorial-object' // First char uppercase, last char lowercase of recognized image object in user locale
  | 'pseudo-captcha'   // First char + last char of pseudo-CAPTCHA badge
  | 'caesar-shift'     // Shift character at anchor position by index
  | 'custom';

export interface CognitiveRule {
  type: TransformationType;
  /** Anchor index (0-indexed) for insertion or shifting */
  anchorIndex?: number;
  /** User configured cognitive language for image/object recognition */
  locale?: SupportedLocale;
  /** Case preservation for word/object boundary ('upper' | 'lower' | 'first-upper-last-lower' | 'as-is') */
  caseMode?: 'upper' | 'lower' | 'first-upper-last-lower' | 'as-is';
  /** Custom transformation hook */
  customTransform?: (baseSecret: string, state: Radix26State) => string;
}

export interface ChallengePayload {
  sessionId: string;
  userId: string;
  hint: string;
  wordHint?: string;
  objectHint?: VisualObjectHint;
  captchaToken?: string;
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
