"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionInfo = void 0;
const AuthContext_1 = require("../contexts/AuthContext");
const useSessionRefresh_1 = require("../hooks/useSessionRefresh");
const SessionInfo = () => {
    const { isLoggedIn, user, session, customerId } = (0, AuthContext_1.useAuth)();
    // Enable session refresh
    (0, useSessionRefresh_1.useSessionRefresh)();
    if (!isLoggedIn || !session) {
        return null;
    }
    const formatDate = (date) => {
        if (!date)
            return 'N/A';
        return new Date(date).toLocaleString();
    };
    const getSessionAge = () => {
        if (!session.lastLogin)
            return 'N/A';
        const now = new Date();
        const lastLogin = new Date(session.lastLogin);
        const diffMs = now.getTime() - lastLogin.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0)
            return `${diffDays} day(s)`;
        if (diffHours > 0)
            return `${diffHours} hour(s)`;
        return `${diffMins} minute(s)`;
    };
    return (<div className="bg-gray-100 p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Session Information</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">User ID:</span>
          <span className="text-gray-800">{(user === null || user === void 0 ? void 0 : user.uid) || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Customer ID:</span>
          <span className="text-gray-800">{customerId || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Email:</span>
          <span className="text-gray-800">{(user === null || user === void 0 ? void 0 : user.email) || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Session ID:</span>
          <span className="text-gray-800 font-mono text-xs">{session.sessionId}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Last Login:</span>
          <span className="text-gray-800">{formatDate(session.lastLogin)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Session Age:</span>
          <span className="text-gray-800">{getSessionAge()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Status:</span>
          <span className="text-green-600 font-medium">Active</span>
        </div>
      </div>
    </div>);
};
exports.SessionInfo = SessionInfo;
