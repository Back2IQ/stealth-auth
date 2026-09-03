/**
 * Back2IQ StealthAuth - Interactive Console Demo
 * Run with: npx tsx examples/demo.ts
 */

import { StealthAuthServer } from '../src/server/stealth-auth-server.js';
import { StealthAuthClient } from '../src/client/stealth-auth-client.js';
import { CognitiveRule } from '../src/types.js';

async function runDemo() {
  console.log('===========================================================');
  console.log('  Back2IQ StealthAuth - Cognitive Zero-Device MFA Demo');
  console.log('  (c) Back2IQ - Ahead by Design (Deniz Kiran)');
  console.log('===========================================================\n');

  // 1. Initialise Server & Register User
  const server = new StealthAuthServer();
  const userId = 'executive@defense-tech.corp';
  const masterPassword = '!!!!!1g0750n17!!!!!'; // In user muscle memory
  const cognitiveRule: CognitiveRule = {
    type: 'insert-at-anchor',
    anchorIndex: 5, // Insert at 5th position: "!!!!!" + LETTER + "1g0750n17!!!!!"
  };

  await server.registerUser(userId, masterPassword, cognitiveRule);
  console.log(`[+] User Registered: ${userId}`);
  console.log(`[+] Master Secret in Muscle Memory: ${masterPassword}`);
  console.log(`[+] Cognitive Rule: Insert drawn Radix-26 letter at index 5`);
  console.log(`[+] Server stores 26 Ed25519 public keys - no password, no rule, no counter\n`);

  // 2. Perform 3 logins, each against a freshly drawn challenge
  for (let i = 0; i < 3; i++) {
    console.log(`--- STEP ${i + 1}: Login with a freshly drawn challenge ---`);

    // Server generates challenge
    const challenge = await server.createChallenge(userId, { mode: 'build-version' });
    console.log(`  [Server] Disguised UI Hint: "${challenge.disguisedHint}" (Raw Hint: ${challenge.hint})`);
    console.log(`  [Server] Session Nonce: ${challenge.nonce.slice(0, 16)}...`);

    // User reads the hint and transforms the password in their head
    console.log(`  [User Brain] Cognitive Output: ${StealthAuthClient.transformPassword(masterPassword, challenge.hint, cognitiveRule)}`);

    // One call does the rest: transform, derive this challenge's key, sign the session
    const authPayload = StealthAuthClient.answerChallenge(masterPassword, challenge, cognitiveRule);

    // Server verifies
    const result = await server.verifyResponse(authPayload);
    console.log(`  [Server Verification]: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  [Verified Challenge]: ${result.challengeIndex}`);
    console.log(`  [Auth Token]: ${result.authToken?.slice(0, 32)}...\n`);
  }

  // 3. There is no counter to desynchronize: the challenge is drawn, not counted
  console.log('--- STEP 4: No Desynchronization by Construction ---');
  console.log('  Each login draws independently from 26 values, so an aborted');
  console.log('  session leaves no state behind to fall out of sync.');

  const drawn = new Set<number>();
  for (let i = 0; i < 12; i++) {
    drawn.add((await server.createChallenge(userId)).index);
  }
  console.log(`  [12 Draws]: ${[...drawn].sort((a, b) => a - b).join(', ')}\n`);

  console.log('===========================================================');
  console.log('  Demo Completed Successfully.');
  console.log('===========================================================');
}

runDemo().catch(console.error);
