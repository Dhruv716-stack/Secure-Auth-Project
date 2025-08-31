"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionEventProvider = TransactionEventProvider;
exports.useTransactionEvent = useTransactionEvent;
const react_1 = __importStar(require("react"));
const TransactionEventContext = (0, react_1.createContext)(undefined);
function TransactionEventProvider({ children }) {
    const [pendingTransaction, setPendingTransaction] = (0, react_1.useState)(null);
    // Call this when a transaction occurs
    const triggerTransaction = (amount, date) => {
        setPendingTransaction({ amount, date: date || new Date().toISOString() });
        // Reset after 2 seconds so only one batch uses it
        setTimeout(() => setPendingTransaction(null), 2000);
    };
    return (<TransactionEventContext.Provider value={{ pendingTransaction, triggerTransaction }}>
      {children}
    </TransactionEventContext.Provider>);
}
function useTransactionEvent() {
    const ctx = (0, react_1.useContext)(TransactionEventContext);
    if (!ctx)
        throw new Error("useTransactionEvent must be used within TransactionEventProvider");
    return ctx;
}
