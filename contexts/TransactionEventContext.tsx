"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type PendingTransaction = { amount: number; date: string } | null;

interface TransactionEventContextType {
  pendingTransaction: PendingTransaction;
  triggerTransaction: (amount: number, date?: string) => void;
}

const TransactionEventContext = createContext<TransactionEventContextType | undefined>(undefined);

export function TransactionEventProvider({ children }: { children: ReactNode }) {
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction>(null);

  // Call this when a transaction occurs
  const triggerTransaction = (amount: number, date?: string) => {
    setPendingTransaction({ amount, date: date || new Date().toISOString() });
    // Reset after 2 seconds so only one batch uses it
    setTimeout(() => setPendingTransaction(null), 2000);
  };

  return (
    <TransactionEventContext.Provider value={{ pendingTransaction, triggerTransaction }}>
      {children}
    </TransactionEventContext.Provider>
  );
}

export function useTransactionEvent() {
  const ctx = useContext(TransactionEventContext);
  if (!ctx) throw new Error("useTransactionEvent must be used within TransactionEventProvider");
  return ctx;
} 