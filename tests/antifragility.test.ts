/**
 * Back2IQ DynPass - Antifragile Immunity Engine & Bug-to-Improvement Test Suite
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SystemImmunityEngine,
  globalImmunityEngine,
  applySlotTransformation,
  applyCognitiveTransformation,
  encodeRadix26,
  decodeRadix26,
  DynPassServer,
  DynPassClient,
  InMemoryStorageAdapter,
  getVisualObjectWord,
  buildPublicKeyTable,
} from '../src/index.js';

describe('1. Antifragile Immunity Engine - Core & Anomaly Trapping', () => {
  let engine: SystemImmunityEngine;

  beforeEach(() => {
    engine = new SystemImmunityEngine('test-immunity-salt', 60000);
  });

  it('traps an anomaly without crashing and records a zero-knowledge vector', () => {
    const vector = engine.trapAnomaly(
      'SLOT_OUT_OF_BOUNDS',
      { slots: [NaN, -99], rawInput: 'test-boundary' },
      new Error('Invalid boundary range')
    );

    expect(vector.id.startsWith('imm_')).toBe(true);
    expect(vector.category).toBe('SLOT_OUT_OF_BOUNDS');
    expect(vector.fingerprint).toHaveLength(16);
    expect(vector.mitigationApplied).toContain('Bounded slot indices');
    expect(vector.synthesizedTestCode).toContain('it(');
    expect(vector.synthesizedTestCode).toContain(vector.fingerprint);

    const stats = engine.getStats();
    expect(stats.totalAnomaliesTrapped).toBe(1);
    expect(stats.vectorsByCategory.SLOT_OUT_OF_BOUNDS).toBe(1);
  });

  it('redacts/hashes any sensitive secret or password in anomaly payloads', () => {
    const vector = engine.trapAnomaly('MALFORMED_PAYLOAD', {
      userId: 'alice@test.corp',
      password: 'SuperSecretPlaintextPassword123',
      masterPassword: 'MasterPlaintextPassword456',
    });

    const payload = vector.sanitizedPayload as Record<string, string>;
    expect(payload.password.startsWith('[HASHED:')).toBe(true);
    expect(payload.password).not.toContain('SuperSecretPlaintextPassword123');
    expect(payload.masterPassword.startsWith('[HASHED:')).toBe(true);
    expect(payload.masterPassword).not.toContain('MasterPlaintextPassword456');
  });

  it('auto-synthesizes an executable Vitest regression test suite', () => {
    engine.trapAnomaly('SLOT_OUT_OF_BOUNDS', { slots: [999, 1000] });
    engine.trapAnomaly('CRYPTO_CORRUPTION', { responseHash: 'corrupt-sig' });
    engine.trapAnomaly('EXPIRED_SESSION_REPLAY', { sessionId: 'fake-session' });

    const testSuite = engine.exportImmunityRegressionSuite();
    expect(testSuite).toContain('Auto-Generated Antifragility Regression Suite');
    expect(testSuite).toContain('describe(\'System Immunity Auto-Synthesized Regression Suite\'');
    expect(testSuite).toContain('Trapped Vectors: 3');
    expect(testSuite).toContain('Immunity Vector [');
  });
});

describe('2. Adaptive Defense Escalation (Taleb Antifragility)', () => {
  let engine: SystemImmunityEngine;

  beforeEach(() => {
    engine = new SystemImmunityEngine('escalation-salt', 60000);
  });

  it('escalates threat level from NORMAL -> ELEVATED -> CRITICAL as anomalies spike', () => {
    expect(engine.getThreatLevel()).toBe('NORMAL');
    expect(engine.getAdaptiveMaxAttempts(5)).toBe(5);
    expect(engine.getAdaptiveLockoutSeconds(300)).toBe(300);

    // Inject 3 anomalies -> ELEVATED
    engine.trapAnomaly('MALFORMED_PAYLOAD', { a: 1 });
    engine.trapAnomaly('MALFORMED_PAYLOAD', { a: 2 });
    engine.trapAnomaly('MALFORMED_PAYLOAD', { a: 3 });

    expect(engine.getThreatLevel()).toBe('ELEVATED');
    expect(engine.getAdaptiveMaxAttempts(5)).toBe(3); // Tightened!
    expect(engine.getAdaptiveLockoutSeconds(300)).toBe(600); // Doubled!

    // Inject 3 more anomalies (total 6) -> CRITICAL
    engine.trapAnomaly('CRYPTO_CORRUPTION', { b: 1 });
    engine.trapAnomaly('CRYPTO_CORRUPTION', { b: 2 });
    engine.trapAnomaly('CRYPTO_CORRUPTION', { b: 3 });

    expect(engine.getThreatLevel()).toBe('CRITICAL');
    expect(engine.getAdaptiveMaxAttempts(5)).toBe(1); // Single strike lock!
    expect(engine.getAdaptiveLockoutSeconds(300)).toBe(3600); // 1 hour lockout!
  });

  it('safeExecute catches exceptions, registers immunity vector, and returns fallback', () => {
    const dangerousOp = () => {
      throw new Error('Exploit attempt simulated');
    };

    const result = engine.safeExecute(
      dangerousOp,
      'SAFE_FALLBACK',
      { category: 'UNKNOWN_ANOMALY', operation: 'testExploit' }
    );

    expect(result).toBe('SAFE_FALLBACK');
    expect(engine.getStats().totalAnomaliesTrapped).toBe(1);
  });
});

describe('3. Edge-Case Normalization & Bugcheck Invariants', () => {
  it('applySlotTransformation handles NaN, null, negative and out-of-range slots cleanly', () => {
    const base = 'AlphaBeta123';

    // NaN slots
    const res1 = applySlotTransformation(base, 'X', 'Y', [NaN, NaN] as any);
    expect(res1).toBeDefined();
    expect(res1.length).toBe(base.length + 2);

    // Undefined slots
    const res2 = applySlotTransformation(base, 'X', 'Y', undefined as any);
    expect(res2).toBeDefined();
    expect(res2.length).toBe(base.length + 2);

    // Inverted and negative slots
    const res3 = applySlotTransformation(base, 'X', 'Y', [-5, 100] as any);
    expect(res3).toBeDefined();
    expect(res3.length).toBe(base.length + 2);

    // Empty base string
    const res4 = applySlotTransformation('', 'A', 'B', [2, 5]);
    expect(res4).toBe('AB');
  });

  it('getVisualObjectWord handles null/undefined objects without throwing', () => {
    expect(() => getVisualObjectWord(undefined as any)).not.toThrow();
    expect(getVisualObjectWord(undefined as any)).toBe('Object');

    expect(() => getVisualObjectWord({} as any)).not.toThrow();
    expect(getVisualObjectWord({} as any)).toBe('Object');
  });

  it('encodeRadix26 and decodeRadix26 deterministically set questionHint and spokenAudioWord', () => {
    const state0 = encodeRadix26(0);
    expect(state0.questionHint).toBeDefined();
    expect(state0.questionHint?.question.de).toBeDefined();
    expect(state0.spokenAudioWord).toBe(state0.wordHint);

    const decoded = decodeRadix26('1');
    expect(decoded.questionHint).toBeDefined();
    expect(decoded.questionHint?.id).toBe(state0.questionHint?.id);
    expect(decoded.spokenAudioWord).toBe(decoded.wordHint);
  });

  it('guarantees key table alignment for personal-questions modality', async () => {
    const server = new DynPassServer(new InMemoryStorageAdapter());
    const rule = {
      type: 'slot-placement' as const,
      slots: [2, 5] as [number, number],
      modality: 'personal-questions' as const,
      locale: 'de' as const,
    };
    const password = 'ExecutiveSecretPass99!';

    await server.registerUser('exec@test.corp', password, rule);
    const challenge = await server.createChallenge('exec@test.corp');

    expect(challenge.modality).toBe('personal-questions');
    expect(challenge.questionHint).toBeDefined();

    // Client answers using the biographical question answer
    const response = DynPassClient.answerChallenge(password, challenge, rule);
    const verifyResult = await server.verifyResponse(response);

    expect(verifyResult.success).toBe(true);
    expect(verifyResult.userId).toBe('exec@test.corp');
  });
});

describe('4. Server Immunity Boundary & Anomaly Interception', () => {
  it('intercepts malformed payloads and traps them in immunity ledger', async () => {
    const server = new DynPassServer(new InMemoryStorageAdapter());
    
    // Null payload
    const res1 = await server.verifyResponse(null as any);
    expect(res1.success).toBe(false);
    expect(res1.error).toBe('SESSION_EXPIRED_OR_INVALID');

    // Missing responseHash
    const res2 = await server.verifyResponse({ sessionId: 'session-123' } as any);
    expect(res2.success).toBe(false);
    expect(res2.error).toBe('INVALID_CREDENTIALS');

    // Corrupt signature (non-hex or invalid length)
    const res3 = await server.verifyResponse({
      sessionId: 'session-456',
      responseHash: 'not-a-valid-hex-signature-string',
      clientTimestamp: Date.now(),
    });
    expect(res3.success).toBe(false);

    expect(server.immunity.getStats().totalAnomaliesTrapped).toBeGreaterThanOrEqual(3);
  });

  it('rejects expired sessions with defense-in-depth and traps anomaly', async () => {
    const storage = new InMemoryStorageAdapter();
    const server = new DynPassServer(storage);

    // Create session that expired 10 seconds ago
    await storage.createSession({
      sessionId: 'expired-session-1',
      userId: 'test@corp',
      challengeIndex: 1,
      nonce: 'nonce-xyz',
      createdAt: Date.now() - 20000,
      expiresAt: Date.now() - 10000,
    });

    const result = await server.verifyResponse({
      sessionId: 'expired-session-1',
      responseHash: '0'.repeat(128),
      clientTimestamp: Date.now(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('SESSION_EXPIRED_OR_INVALID');
    expect(server.immunity.getStats().vectorsByCategory.EXPIRED_SESSION_REPLAY).toBeGreaterThanOrEqual(1);
  });
});
