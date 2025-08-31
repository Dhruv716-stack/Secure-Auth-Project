# Session Management System

This document explains how to use the comprehensive session management system implemented in this application.

## Overview

The session management system provides:
- **Secure session storage** using localStorage with automatic cleanup
- **Session timeout** (24 hours by default)
- **Automatic session refresh** on user activity
- **Firebase authentication integration**
- **Session validation** and cleanup
- **User-specific session data**

## Components

### 1. SessionManager (`lib/session.ts`)

The core session management class that handles:
- Session creation and storage
- Session validation and cleanup
- Session timeout management
- Unique session ID generation

```typescript
import { sessionManager } from '../lib/session';

// Create a new session
const session = sessionManager.createSession(user, customerId);

// Get current session
const currentSession = sessionManager.getSession();

// Refresh session
sessionManager.refreshSession();

// Clear session (logout)
sessionManager.clearSession();
```

### 2. AuthContext (`contexts/AuthContext.tsx`)

Enhanced authentication context that integrates with Firebase and session management:

```typescript
import { useAuth } from '../contexts/AuthContext';

const { 
  isLoggedIn, 
  user, 
  session, 
  customerId, 
  login, 
  logout, 
  refreshSession 
} = useAuth();
```

### 3. useSessionRefresh Hook (`hooks/useSessionRefresh.ts`)

Automatically refreshes sessions on user activity:

```typescript
import { useSessionRefresh } from '../hooks/useSessionRefresh';

// In your component
useSessionRefresh(); // Refreshes every 5 minutes by default
useSessionRefresh(10 * 60 * 1000); // Custom interval (10 minutes)
```

### 4. SessionInfo Component (`components/SessionInfo.tsx`)

Displays current session information for debugging and user feedback.

### 5. ProtectedRoute Component (`components/ProtectedRoute.tsx`)

Protects routes from unauthenticated access.

## Usage Examples

### Basic Session Management

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { isLoggedIn, user, session, login, logout } = useAuth();

  const handleLogin = async (user: User) => {
    // Login with Firebase user and optional customer ID
    login(user, 'custom-customer-id');
  };

  const handleLogout = () => {
    // This will clear both Firebase auth and session
    logout();
  };

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <p>Welcome, {user?.email}</p>
          <p>Session ID: {session?.sessionId}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Protected Routes

```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

### Session Information Display

```typescript
import { SessionInfo } from '../components/SessionInfo';

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <SessionInfo /> {/* Shows session details */}
    </div>
  );
}
```

### Automatic Session Refresh

```typescript
import { useSessionRefresh } from '../hooks/useSessionRefresh';

function App() {
  // Automatically refreshes session on user activity
  useSessionRefresh();
  
  return <div>Your app content</div>;
}
```

## Session Data Structure

```typescript
interface UserSession {
  user: User | null;           // Firebase user object
  customerId: string | null;    // Custom customer identifier
  isLoggedIn: boolean;          // Login status
  lastLogin: Date | null;       // Last login timestamp
  sessionId: string | null;     // Unique session identifier
}
```

## Configuration

### Session Timeout

Default session timeout is 24 hours. You can customize it:

```typescript
import { sessionManager } from '../lib/session';

// Set custom timeout (e.g., 12 hours)
sessionManager.setSessionTimeout(12 * 60 * 60 * 1000);
```

### Session Refresh Interval

Default refresh interval is 5 minutes. Customize in the hook:

```typescript
// Refresh every 10 minutes
useSessionRefresh(10 * 60 * 1000);
```

## Security Features

1. **Automatic Cleanup**: Expired sessions are automatically cleared
2. **SSR Safe**: All session operations check for `window` availability
3. **Error Handling**: Graceful error handling for localStorage operations
4. **Firebase Integration**: Seamless integration with Firebase authentication
5. **Session Validation**: Sessions are validated on each access

## Best Practices

1. **Always use ProtectedRoute** for sensitive pages
2. **Enable session refresh** in your main app component
3. **Handle loading states** while authentication is being checked
4. **Use session data** for user-specific features
5. **Implement proper error handling** for authentication failures

## Troubleshooting

### Session Not Persisting
- Check if localStorage is available
- Verify environment variables are set correctly
- Ensure Firebase is properly initialized

### Session Expiring Too Quickly
- Adjust session timeout: `sessionManager.setSessionTimeout()`
- Check if session refresh is enabled
- Verify user activity is being detected

### Firebase Integration Issues
- Ensure Firebase is properly configured
- Check if auth state listener is working
- Verify Firebase user object is valid

## Environment Variables

Make sure your `.env.local` file contains the Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
``` 