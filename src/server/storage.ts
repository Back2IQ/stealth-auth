/**
 * Back2IQ StealthAuth - Storage Adapters
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 */

import { IStorageAdapter, UserAuthRecord, ActiveSessionRecord } from '../types.js';

export class InMemoryStorageAdapter implements IStorageAdapter {
  private users: Map<string, UserAuthRecord> = new Map();
  private sessions: Map<string, ActiveSessionRecord> = new Map();

  async getUser(userId: string): Promise<UserAuthRecord | null> {
    const user = this.users.get(userId);
    return user ? JSON.parse(JSON.stringify(user)) : null;
  }

  async saveUser(user: UserAuthRecord): Promise<void> {
    this.users.set(user.userId, JSON.parse(JSON.stringify(user)));
  }

  async updateUserFailedAttempts(userId: string, failedAttempts: number, lockedUntil?: number): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    user.failedAttempts = failedAttempts;
    user.lockedUntil = lockedUntil;
    user.updatedAt = Date.now();
  }

  async createSession(session: ActiveSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, JSON.parse(JSON.stringify(session)));
  }

  async getSession(sessionId: string): Promise<ActiveSessionRecord | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    return JSON.parse(JSON.stringify(session));
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  /**
   * Helper to inspect internal count for testing
   */
  get activeSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Helper to clear all state
   */
  clear(): void {
    this.users.clear();
    this.sessions.clear();
  }
}
