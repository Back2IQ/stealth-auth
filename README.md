# Back2IQ DynPass – Cognitive Zero-Device MFA

[![Back2IQ](https://img.shields.io/badge/Back2IQ-Ahead%20by%20Design-00d2ff.svg)](https://back2iq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%20Strict-blue.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen.svg)](https://vitest.dev/)
[![Patent Pending](https://img.shields.io/badge/Patent%20Pending-DPMA%20%7C%20EPA%20%7C%20USPTO-orange.svg)](docs/PATENT_SPECIFICATION_DPMA_EPA_USPTO.md)

**Back2IQ DynPass** is a token- and smartphone-free cognitive authentication engine designed for ultra-secure environments (Air-Gapped Industrial Plants, Cleanrooms, SCIF / Military Facilities, and Executive High-Threat Travel).

---

## Key Features

1. **4 Selectable Security Modalities:**
   - 🔤 **Random Code / Codename (Medium, ~30s):** e.g. `Falcon` $\rightarrow$ `F...n`
   - 🖼️ **Visual Images (High, ~45s):** e.g. 🐱 `Katze` $\rightarrow$ `K...e`
   - 🔊 **Spoken Audio Word (High, ~45s):** e.g. Voice speaks *"Tiger"* $\rightarrow$ `T...r` (100% shoulder-surfing immune)
   - 🛡️ **Personal Life Questions (Highest Tier, ~3-5m):** 18+ question pool (e.g. *"First pet?"* $\rightarrow$ `Bello` $\rightarrow$ `B...o`, uncrackable even with full screen observation)
2. **Arbitrary Base Password & Precision Index Slots:**
   - Works on words (`Mama1977`) or arbitrary character strings (`12345qwert`).
   - Insertion at exact index positions (e.g. `slots: [2, 5]` on `12345qwert` with `Hut` $\rightarrow$ `1H234tqwert`).
3. **Zero-Device & Zero-Hardware Overhead:** No smartphones, TOTP apps, SMS codes, or YubiKeys required.
4. **Anti-Phishing Countersign:** Server displays user's personal recognition word (*"Blaue Tür"*). Cloned phishing sites are exposed before typing.
5. **0 Byte Plaintext on Server:** Uses Ed25519 asymmetric keypairs derived via local `scrypt`. Server stores public keys only.

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
