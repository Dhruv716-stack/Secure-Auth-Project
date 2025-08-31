"use client";
import { useAuth } from "@/contexts/AuthContext";
import { sessionManager } from "@/lib/session";
import { useSessionBatch } from "@/hooks/useSessionBatch";
import { useTransactionEvent } from "@/contexts/TransactionEventContext";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { useMemo } from "react";

export function SessionBatcher() {
  const { customerId, isLoggedIn } = useAuth();
  const { pendingTransaction } = useTransactionEvent();
  const sessionId = useMemo(() => {
    if (typeof window !== "undefined") {
      const session = sessionManager.getSession();
      return session?.sessionId || null;
    }
    return null;
  }, [isLoggedIn, customerId]);
  useSessionBatch(customerId, sessionId, pendingTransaction); // Always called
  useIdleLogout(120000); // Always called
  return null;
} 