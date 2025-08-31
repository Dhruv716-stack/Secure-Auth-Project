"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = exports.SessionManager = void 0;
class SessionManager {
    constructor() {
        this.sessionKey = 'userSession';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }
    static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }
    // Create a new session for logged-in user
    createSession(user, customerId) {
        const session = {
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
    getSession() {
        if (typeof window === 'undefined')
            return null;
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData)
                return null;
            const session = JSON.parse(sessionData);
            // Check if session is still valid
            if (this.isSessionValid(session)) {
                return session;
            }
            else {
                this.clearSession();
                return null;
            }
        }
        catch (error) {
            console.error('Error reading session:', error);
            this.clearSession();
            return null;
        }
    }
    // Update session with new data
    updateSession(updates) {
        const currentSession = this.getSession();
        if (!currentSession)
            return null;
        const updatedSession = Object.assign(Object.assign(Object.assign({}, currentSession), updates), { lastLogin: new Date() // Update last activity
         });
        this.saveSession(updatedSession);
        return updatedSession;
    }
    // Clear session (logout)
    clearSession() {
        if (typeof window === 'undefined')
            return;
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('customerId');
    }
    // Check if session is valid
    isSessionValid(session) {
        if (!session.lastLogin)
            return false;
        const now = new Date();
        const lastLogin = new Date(session.lastLogin);
        const timeDiff = now.getTime() - lastLogin.getTime();
        return timeDiff < this.sessionTimeout;
    }
    // Generate unique session ID
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Save session to localStorage
    saveSession(session) {
        if (typeof window === 'undefined')
            return;
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('customerId', session.customerId || '');
        }
        catch (error) {
            console.error('Error saving session:', error);
        }
    }
    // Refresh session (extend timeout)
    refreshSession() {
        const session = this.getSession();
        if (session) {
            return this.updateSession({ lastLogin: new Date() });
        }
        return null;
    }
    // Get session timeout duration
    getSessionTimeout() {
        return this.sessionTimeout;
    }
    // Set custom session timeout
    setSessionTimeout(timeout) {
        this.sessionTimeout = timeout;
    }
}
exports.SessionManager = SessionManager;
// Export singleton instance
exports.sessionManager = SessionManager.getInstance();
