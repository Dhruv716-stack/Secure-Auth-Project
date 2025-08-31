import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useIdleLogout(timeoutMs = 120000) { // 2 minutes default
  const { logout, isLoggedIn } = useAuth();
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const resetTimer = () => {
      if (timer.current) clearTimeout(timer.current);
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
      if (timer.current) clearTimeout(timer.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isLoggedIn, logout, timeoutMs]);
} 