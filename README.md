# Back2IQ DynPass – Cognitive Zero-Device MFA

[![Back2IQ](https://img.shields.io/badge/Back2IQ-Ahead%20by%20Design-00d2ff.svg)](https://back2iq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%20Strict-blue.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen.svg)](https://vitest.dev/)
[![Patent Pending](https://img.shields.io/badge/Patent%20Pending-DPMA%20%7C%20EPA%20%7C%20USPTO-orange.svg)](docs/PATENT_SPECIFICATION_DPMA_EPA_USPTO.md)

**Back2IQ DynPass** is a token- and smartphone-free cognitive authentication engine designed for ultra-secure environments (Air-Gapped Industrial Plants, Cleanrooms, SCIF / Military Facilities, and Executive High-Threat Travel).

---

## Key Features

1. **Zero-Device & Zero-Hardware Overhead:** No smartphones, TOTP apps, SMS codes, or YubiKeys required.
2. **Deterministic Radix-26 State Machine:** Compact bijective state encoding ($N = 26 \times C + (I - 1)$) disguised as innocuous UI elements (e.g. `v1.14` or `Ticket #14`).
3. **Muscle-Memory Cognitive Anchoring:** Deterministic cognitive transformation $P_N = \mathcal{T}(S, L(I))$ executed purely in human memory.
4. **Anti-Desynchronization Engine:** Automatic resynchronization via sliding lookahead/lookback window $W(N) = [N-1, N+3]$.
5. **Replay & Timing Attack Immunity:** Constant-time verification, cryptographic session nonces, and single-use challenge expiration.

---

## Quick Start (SDK Usage)

### Server Installation & Usage
```bash
npm install @back2iq/dynpass
```

```typescript
import { DynPassServer, InMemoryStorageAdapter } from '@back2iq/stealth-auth';

const server = new DynPassServer(new InMemoryStorageAdapter(), {
  lookaheadWindowForward: 3,
  sessionTtlSeconds: 180,
});

// 1. Register User
await server.registerUser('user@corp.com', '!!!!!1g0750n17!!!!!', {
  type: 'insert-at-anchor',
  anchorIndex: 5,
});

// 2. Generate Challenge with Disguised UI Hint
const challenge = await server.createChallenge('user@corp.com', {
  mode: 'build-version', // Renders as "v1.14" in login UI
});

// 3. Verify Response Payload
const result = await server.verifyResponse(clientResponsePayload);
if (result.success) {
  console.log('Authenticated! JWT Token:', result.authToken);
}
```

### Client-Side Cognitive Transformation
```typescript
import { DynPassClient } from '@back2iq/stealth-auth';

// 1. Extract Hint from UI (e.g., "Build v1.14" -> Index 14 -> Letter 'N')
const state = DynPassClient.parseHint('Build v1.14', 'build-version');

// 2. Transform Master Password in Memory
const transformed = DynPassClient.transformPassword('!!!!!1g0750n17!!!!!', state!, {
  type: 'insert-at-anchor',
  anchorIndex: 5,
}); // Output: "!!!!!N1g0750n17!!!!!"

// 3. Create Session-bound Response
const authPayload = DynPassClient.createAuthResponse(transformed, challenge);
```

---

## Verification & Test Suite

```bash
# Run 100% test coverage suite
npm test

# Run TypeScript strict type-check
npm run typecheck
```

---

## Documentation

- [Mathematische Spezifikation & Architektur (Implementation Plan)](implementation_plan.md)
- [Patentschrift-Skizze DPMA / EPA / USPTO](docs/PATENT_SPECIFICATION_DPMA_EPA_USPTO.md)
- [B2B Go-To-Market & Monetarisierungs-Roadmap](docs/GTM_MONETIZATION_ROADMAP.md)

---

## Back2IQ Ecosystem & Credits

- **Studio:** Back2IQ – Ahead by Design ([back2iq.com](https://back2iq.com))
- **Founder:** Deniz Kiran (Freelance Software Engineer & Cyber-Intelligence Architect, Antalya, Turkey)
- **Ecosystem:** [Trust2IQ](https://trust2iq.com) | [CSRD2IQ](https://csrd2iq.com) | [Pitch2IQ](https://pitch2iq.com)
