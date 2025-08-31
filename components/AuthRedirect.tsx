"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AuthRedirect = ({ children, redirectTo = "/dashboard" }: AuthRedirectProps) => {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        router.push(redirectTo);
      }, 1000); // Reduced from 1500ms to 1000ms
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, isLoading, router, redirectTo]);

  return (
    <>
      {showBanner && (
        <div className="fixed top-0 left-0 w-full z-50 bg-green-600 text-white flex items-center justify-center py-2 px-4 shadow-md animate-fade-in-down">
          <CheckCircle className="h-5 w-5 mr-2 text-white" />
          <span className="font-medium">You are already logged in. Redirecting to dashboard...</span>
          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
        </div>
      )}
      {children}
    </>
  );
};

export { AuthRedirect };