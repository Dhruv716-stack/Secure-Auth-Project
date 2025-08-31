"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionBatcher = SessionBatcher;
const AuthContext_1 = require("@/contexts/AuthContext");
const session_1 = require("@/lib/session");
const useSessionBatch_1 = require("@/hooks/useSessionBatch");
const TransactionEventContext_1 = require("@/contexts/TransactionEventContext");
const useIdleLogout_1 = require("@/hooks/useIdleLogout");
const react_1 = require("react");
function SessionBatcher() {
    const { customerId, isLoggedIn } = (0, AuthContext_1.useAuth)();
    const { pendingTransaction } = (0, TransactionEventContext_1.useTransactionEvent)();
    const sessionId = (0, react_1.useMemo)(() => {
        if (typeof window !== "undefined") {
            const session = session_1.sessionManager.getSession();
            return (session === null || session === void 0 ? void 0 : session.sessionId) || null;
        }
        return null;
    }, [isLoggedIn, customerId]);
    (0, useSessionBatch_1.useSessionBatch)(customerId, sessionId, pendingTransaction); // Always called
    (0, useIdleLogout_1.useIdleLogout)(120000); // Always called
    return null;
}
