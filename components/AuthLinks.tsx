"use client"

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';

interface AuthLinksProps {
  variant?: 'header' | 'hero' | 'card';
  className?: string;
}

const AuthLinks = ({ variant = 'header', className = '' }: AuthLinksProps) => {
  const { isLoggedIn, user, logout, isLoading } = useAuth();

  // Simple loading state
  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  // Logged in state
  if (isLoggedIn && user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user.name || user.customerId || 'User'}
            </p>
            <p className="text-xs text-gray-500">Customer ID: {user.customerId}</p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Dashboard
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={logout} className="text-gray-600 hover:text-red-600">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Not logged in - show login/signup buttons
  switch (variant) {
    case 'header':
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <Link href="/signup">
            <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Sign Up
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Net Banking
            </Button>
          </Link>
        </div>
      );

    case 'hero':
      return (
        <div className={`flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start ${className}`}>
          <Link href="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Access Net Banking
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
              Create Account
            </Button>
          </Link>
        </div>
      );

    case 'card':
      return (
        <Link href="/login">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Access Now
          </Button>
        </Link>
      );

    default:
      return null;
  }
};

export { AuthLinks }; 