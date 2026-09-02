/**
 * Back2IQ StealthAuth - Curated Deterministic Word Dictionary
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 * 
 * Provides instantaneous 0-cognitive-load hints (e.g. "Falcon", "Vanguard", "Quantum")
 * where users instantly extract the First and/or Last character without alphabet counting.
 */

export const DETERMINISTIC_WORD_MAP: Record<number, string[]> = {
  1: ['Atlas', 'Apollo', 'Apex', 'Aegis'],           // A
  2: ['Bravo', 'Beacon', 'Blaze', 'Bison'],          // B
  3: ['Cyber', 'Cipher', 'Cosmos', 'Chronos'],       // C
  4: ['Delta', 'Dragon', 'Dynamo', 'Drift'],         // D
  5: ['Echo', 'Eclipse', 'Enigma', 'Eagle'],         // E
  6: ['Falcon', 'Frost', 'Fusion', 'Flux'],          // F
  7: ['Gamma', 'Guardian', 'Gravity', 'Glider'],     // G
  8: ['Helios', 'Horizon', 'Hydra', 'Hyper'],        // H
  9: ['Ignite', 'Impulse', 'Infinity', 'Iron'],      // I
  10: ['Jupiter', 'Javelin', 'Jaguar', 'Jet'],       // J
  11: ['Krypton', 'Knight', 'Kestrel', 'Karma'],     // K
  12: ['Lunar', 'Laser', 'Legacy', 'Lotus'],         // L
  13: ['Matrix', 'Meteor', 'Magma', 'Mirage'],       // M
  14: ['Nexus', 'Nebula', 'Nova', 'Network'],        // N
  15: ['Orbit', 'Orion', 'Omega', 'Onyx'],           // O
  16: ['Phoenix', 'Polaris', 'Pulse', 'Prism'],      // P
  17: ['Quantum', 'Quasar', 'Quest', 'Quartz'],      // Q
  18: ['Radar', 'Raptor', 'Rocket', 'Raven'],        // R
  19: ['Solar', 'Shadow', 'Shield', 'Summit'],       // S
  20: ['Titan', 'Taurus', 'Trigger', 'Tempest'],     // T
  21: ['Ultra', 'Ursa', 'Unity', 'Umbra'],           // U
  22: ['Viper', 'Vector', 'Vortex', 'Vanguard'],     // V
  23: ['Wraith', 'Wave', 'Wolf', 'Warp'],            // W
  24: ['Xenon', 'Xray', 'Xiphos', 'Xcel'],           // X
  25: ['Yield', 'Yeti', 'Yonder', 'Yacht'],          // Y
  26: ['Zenith', 'Zephyr', 'Zodiac', 'Zero'],        // Z
};

/**
 * Returns a deterministic codename word for a given index and cycle
 */
export function getWordForState(index: number, cycle = 0): string {
  const words = DETERMINISTIC_WORD_MAP[index];
  if (!words || words.length === 0) {
    return 'Secure';
  }
  const wordIndex = cycle % words.length;
  return words[wordIndex];
}
