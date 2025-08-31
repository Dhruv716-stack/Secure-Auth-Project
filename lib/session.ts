import { User } from 'firebase/auth';
import { auth } from './firebase';

export interface UserSession {
  user: User | null;
  customerId: string | null;
  isLoggedIn: boolean;
  lastLogin: Date | null;
  sessionId: string | null;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessionKey = 'userSession';
  private sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Create a new session for logged-in user
  createSession(user: User, customerId?: string): UserSession {
    const session: UserSession = {
      user,
      customerId: customerId || user.uid,
      isLoggedIn: true,
      lastLogin: new Date(),
      sessionId: this.generateSessionId()
    };

    this.saveSession(session);
    return session;
  }

  // Get current session
  getSession(): UserSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      if (!sessionData) return null;

      const session: UserSession = JSON.parse(sessionData);
      
      // Check if session is still valid
      if (this.isSessionValid(session)) {
        return session;
      } else {
        this.clearSession();
        return null;
      }
    } catch (error) {
      console.error('Error reading session:', error);
      this.clearSession();
      return null;
    }
  }

  // Update session with new data
  updateSession(updates: Partial<UserSession>): UserSession | null {
    const currentSession = this.getSession();
    if (!currentSession) return null;

    const updatedSession: UserSession = {
      ...currentSession,
      ...updates,
      lastLogin: new Date() // Update last activity
    };

    this.saveSession(updatedSession);
    return updatedSession;
  }

  // Clear session (logout)
  clearSession(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('customerId');
  }

  // Check if session is valid
  private isSessionValid(session: UserSession): boolean {
    if (!session.lastLogin) return false;

    const now = new Date();
    const lastLogin = new Date(session.lastLogin);
    const timeDiff = now.getTime() - lastLogin.getTime();

    return timeDiff < this.sessionTimeout;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save session to localStorage
  private saveSession(session: UserSession): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('customerId', session.customerId || '');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Refresh session (extend timeout)
  refreshSession(): UserSession | null {
    const session = this.getSession();
    if (session) {
      return this.updateSession({ lastLogin: new Date() });
    }
    return null;
  }

  // Get session timeout duration
  getSessionTimeout(): number {
    return this.sessionTimeout;
  }

  // Set custom session timeout
  setSessionTimeout(timeout: number): void {
    this.sessionTimeout = timeout;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance(); 