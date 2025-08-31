"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthLinks = void 0;
const AuthContext_1 = require("@/contexts/AuthContext");
const button_1 = require("@/components/ui/button");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const AuthLinks = ({ variant = 'header', className = '' }) => {
    const { isLoggedIn, user, logout, isLoading } = (0, AuthContext_1.useAuth)();
    // Simple loading state
    if (isLoading) {
        return (<div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>);
    }
    // Logged in state
    if (isLoggedIn && user) {
        return (<div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <lucide_react_1.User className="h-4 w-4 text-white"/>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user.name || user.customerId || 'User'}
            </p>
            <p className="text-xs text-gray-500">Customer ID: {user.customerId}</p>
          </div>
        </div>
        <link_1.default href="/dashboard">
          <button_1.Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Dashboard
          </button_1.Button>
        </link_1.default>
        <button_1.Button variant="ghost" size="sm" onClick={logout} className="text-gray-600 hover:text-red-600">
          <lucide_react_1.LogOut className="h-4 w-4"/>
        </button_1.Button>
      </div>);
    }
    // Not logged in - show login/signup buttons
    switch (variant) {
        case 'header':
            return (<div className={`flex items-center space-x-2 ${className}`}>
          <link_1.default href="/signup">
            <button_1.Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Sign Up
            </button_1.Button>
          </link_1.default>
          <link_1.default href="/login">
            <button_1.Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Net Banking
            </button_1.Button>
          </link_1.default>
        </div>);
        case 'hero':
            return (<div className={`flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start ${className}`}>
          <link_1.default href="/login">
            <button_1.Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Access Net Banking
            </button_1.Button>
          </link_1.default>
          <link_1.default href="/signup">
            <button_1.Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
              Create Account
            </button_1.Button>
          </link_1.default>
        </div>);
        case 'card':
            return (<link_1.default href="/login">
          <button_1.Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Access Now
          </button_1.Button>
        </link_1.default>);
        default:
            return null;
    }
};
exports.AuthLinks = AuthLinks;
