"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIdleLogout = useIdleLogout;
const react_1 = require("react");
const AuthContext_1 = require("@/contexts/AuthContext");
function useIdleLogout(timeoutMs = 120000) {
    const { logout, isLoggedIn } = (0, AuthContext_1.useAuth)();
    const timer = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!isLoggedIn)
            return;
        const resetTimer = () => {
            if (timer.current)
                clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                logout();
            }, timeoutMs);
        };
        // List of events that indicate activity
        const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
        events.forEach((event) => window.addEventListener(event, resetTimer));
        // Start the timer
        resetTimer();
        return () => {
            if (timer.current)
                clearTimeout(timer.current);
            events.forEach((event) => window.removeEventListener(event, resetTimer));
        };
    }, [isLoggedIn, logout, timeoutMs]);
}
