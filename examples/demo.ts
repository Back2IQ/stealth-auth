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

  await server.registerUser(userId, masterPassword, cognitiveRule, 0);
  console.log(`[+] User Registered: ${userId}`);
  console.log(`[+] Master Secret in Muscle Memory: ${masterPassword}`);
  console.log(`[+] Cognitive Rule: Insert dynamic Radix-26 letter at index 5\n`);

  // 2. Perform 3 Consecutive Logins across cycle transitions
  const loginSteps = [
    { label: 'Initial Login (Cycle 0, Counter 0)' },
    { label: 'Second Login (Cycle 0, Counter 1)' },
    { label: 'Simulated 14th Login (Counter 13 -> Hint 14 -> Letter N)' },
  ];

  for (let i = 0; i < 3; i++) {
    console.log(`--- STEP ${i + 1}: ${loginSteps[i].label} ---`);
    
    // Server generates challenge
    const challenge = await server.createChallenge(userId, { mode: 'build-version' });
    console.log(`  [Server] Disguised UI Hint: "${challenge.disguisedHint}" (Raw Hint: ${challenge.hint})`);
    console.log(`  [Server] Session Nonce: ${challenge.nonce.slice(0, 16)}...`);

    // Client/User reads hint from UI, transforms password in brain
    const transformed = StealthAuthClient.transformPassword(masterPassword, challenge.hint, cognitiveRule);
    console.log(`  [User Brain] Cognitive Output: ${transformed}`);

    // Client creates session-bound HMAC payload
    const authPayload = StealthAuthClient.createAuthResponse(transformed, challenge);

    // Server verifies
    const result = await server.verifyResponse(authPayload);
    console.log(`  [Server Verification]: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  [New Persistent Counter]: ${result.verifiedCounter! + 1}\n`);
  }

  // 3. Demonstrate Desynchronization Window Recovery
  console.log('--- STEP 4: Anti-Desynchronization Window Recovery ---');
  console.log('  Scenario: User skipped 2 challenges on an aborted terminal session.');
  
  const challengeDesync = await server.createChallenge(userId);
  console.log(`  [Server] Expected Counter: ${challengeDesync.hint}`);

  // User enters password corresponding to +2 forward
  const forwardState = { counter: 5, cycle: 0, index: 6, letter: 'F', hint: '6' };
  const desyncPassword = StealthAuthClient.transformPassword(masterPassword, forwardState, cognitiveRule);
  const desyncPayload = StealthAuthClient.createAuthResponse(desyncPassword, challengeDesync);

  const desyncResult = await server.verifyResponse(desyncPayload);
  console.log(`  [Server Verification]: ${desyncResult.success ? '✅ RESYNC SUCCESS' : '❌ FAILED'}`);
  console.log(`  [Resynced Auto-Alignment]: ${desyncResult.resynced ? 'TRUE (Delta: +' + desyncResult.delta + ')' : 'FALSE'}`);
  console.log(`  [Auth Token Generated]: ${desyncResult.authToken?.slice(0, 32)}...\n`);

  console.log('===========================================================');
  console.log('  Demo Completed Successfully.');
  console.log('===========================================================');
}

runDemo().catch(console.error);
