import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSessionRefresh = (refreshInterval = 5 * 60 * 1000) => { // 5 minutes default
  const { isLoggedIn, refreshSession } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
    } else {
      // Clear interval if user is not logged in
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isLoggedIn, refreshSession, refreshInterval]);

  return { refreshSession };
}; 