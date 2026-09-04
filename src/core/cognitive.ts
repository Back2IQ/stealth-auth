/**
 * Back2IQ StealthAuth - Cognitive Transformation Engine
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 *
 * Single entry point for executing cognitive transformations.
 * Delegates directly to the clean Pipeline & Step Executor.
 */

import { Radix26State, CognitiveRule, MathOperatorType } from '../types.js';
import { executePipelineStep, executeRecipePipeline, applySlotTransformation, computeDynamicSlotShift } from './pipeline.js';

export { applySlotTransformation, computeDynamicSlotShift };

/**
 * Executes cognitive transformation T(S, State, Rule) on the user's master salt S.
 */
export function applyCognitiveTransformation(
  baseSecret: string,
  state: Radix26State,
  rule: CognitiveRule
): string {
  if (!baseSecret) {
    throw new Error('Base secret cannot be empty');
  }

  // 1. Multi-Step Recipe Pipeline Mode
  if (rule.type === 'pipeline' && rule.recipe) {
    return executeRecipePipeline(baseSecret, state, rule.recipe);
  }

  // 2. Single-Step Transformation
  return executePipelineStep(baseSecret, state, {
    op: rule.type as MathOperatorType,
    anchorIndex: rule.anchorIndex,
    anchorIndex2: rule.anchorIndex2,
    slots: rule.slots,
    modality: rule.modality,
    dynamicShift: rule.dynamicShift,
    exponent: rule.exponent,
    modulo: rule.modulo,
    gridPath: rule.gridPath,
    locale: rule.locale,
    caseMode: rule.caseMode,
    caseSensitive: rule.caseSensitive,
    customTransform: rule.customTransform,
  });
}
