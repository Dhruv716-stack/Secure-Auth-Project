"use strict";
"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const session_1 = require("@/lib/session");
const AuthContext = (0, react_1.createContext)(undefined);
function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = (0, react_1.useState)(false);
    const [customerId, setCustomerId] = (0, react_1.useState)(null);
    const [user, setUser] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const router = (0, navigation_1.useRouter)();
    const checkSession = () => __awaiter(this, void 0, void 0, function* () {
        setIsLoading(true);
        try {
            const res = yield fetch("/api/auth/validate-token");
            if (!res.ok)
                throw new Error();
            const data = yield res.json();
            setUser(data.user); // data.user should have .name
            setCustomerId(data.user.customerId);
            setIsLoggedIn(true);
            // Create local session for sessionId if not present
            if (typeof window !== "undefined") {
                const existing = session_1.sessionManager.getSession();
                if (!existing || !existing.sessionId) {
                    session_1.sessionManager.createSession(data.user, data.user.customerId);
                }
            }
        }
        catch (_a) {
            setUser(null);
            setCustomerId(null);
            setIsLoggedIn(false);
            if (typeof window !== "undefined") {
                session_1.sessionManager.clearSession();
            }
        }
        finally {
            setIsLoading(false);
        }
    });
    (0, react_1.useEffect)(() => {
        checkSession();
    }, []);
    const login = (customerId, password, typingPattern, retryAttempt) => __awaiter(this, void 0, void 0, function* () {
        setIsLoading(true);
        try {
            const res = yield fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerId, password, typingPattern, retryAttempt }),
            });
            if (!res.ok) {
                const errorData = yield res.json();
                const error = new Error(errorData.error || "Login failed");
                error.response = { data: errorData };
                throw error;
            }
            yield checkSession();
            router.push("/dashboard");
        }
        catch (err) {
            setUser(null);
            setCustomerId(null);
            setIsLoggedIn(false);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    });
    const logout = () => __awaiter(this, void 0, void 0, function* () {
        setIsLoading(true);
        try {
            yield fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            setCustomerId(null);
            setIsLoggedIn(false);
            router.push("/");
        }
        finally {
            setIsLoading(false);
        }
    });
    const refreshSession = () => __awaiter(this, void 0, void 0, function* () {
        yield checkSession();
    });
    return (<AuthContext.Provider value={{ isLoggedIn, customerId, user, isLoading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>);
}
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
