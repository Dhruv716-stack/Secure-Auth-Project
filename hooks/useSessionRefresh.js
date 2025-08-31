"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSessionRefresh = void 0;
const react_1 = require("react");
const AuthContext_1 = require("../contexts/AuthContext");
const useSessionRefresh = (refreshInterval = 5 * 60 * 1000) => {
    const { isLoggedIn, refreshSession } = (0, AuthContext_1.useAuth)();
    const intervalRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (isLoggedIn) {
            // Set up automatic session refresh on timer
            intervalRef.current = setInterval(() => {
                refreshSession();
            }, refreshInterval);
            // Refresh session when tab regains focus
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    refreshSession();
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
        else {
            // Clear interval if user is not logged in
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    }, [isLoggedIn, refreshSession, refreshInterval]);
    return { refreshSession };
};
exports.useSessionRefresh = useSessionRefresh;
