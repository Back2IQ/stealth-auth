import { describe, it, expect } from 'vitest';
import { CognitiveOnboardingWizard } from '../src/client/onboarding.js';
import { CognitiveRule } from '../src/types.js';

describe('Cognitive Onboarding Wizard & Training Simulator', () => {
  const masterPassword = '!!!!!1g0750n17!!!!!';

  it('provides pre-configured preset profiles', () => {
    const presets = CognitiveOnboardingWizard.getPresetProfiles();
    expect(presets.length).toBeGreaterThanOrEqual(4);
    const ids = presets.map((p) => p.id);
    expect(ids).toContain('slot-placement-audio');
    expect(ids).toContain('slot-placement-questions');
    expect(ids).toContain('slot-placement-text');
    expect(ids).toContain('slot-placement-image');
  });

  it('generates a 3-step training session for word-boundary rule', () => {
    const rule: CognitiveRule = { type: 'word-boundary', caseMode: 'as-is' };
    const session = CognitiveOnboardingWizard.generateTrainingSession(masterPassword, rule);

    expect(session.length).toBe(3);
    expect(session[0].step).toBe(1);
    expect(session[0].disguisedHint).toContain('Atlas');
    expect(session[0].expectedTransformedPassword).toBe('A!!!!!1g0750n17!!!!!s');

    // Step 2: counter 5 -> "Falcon"
    expect(session[1].disguisedHint).toContain('Falcon');
    expect(session[1].expectedTransformedPassword).toBe('F!!!!!1g0750n17!!!!!n');

    // Verify dry-run verification check
    const isCorrect = CognitiveOnboardingWizard.verifyTrainingAttempt(
      'F!!!!!1g0750n17!!!!!n',
      session[1]
    );
    expect(isCorrect).toBe(true);

    const isWrong = CognitiveOnboardingWizard.verifyTrainingAttempt(
      'WRONG_ATTEMPT',
      session[1]
    );
    expect(isWrong).toBe(false);
  });
});
