# Authentication Flow & User Experience

This document explains how the authentication system works and manages user sessions across the application.

## 🔄 Authentication Flow

### 1. **Initial State (Not Logged In)**
- User visits any page
- `AuthContext` checks for existing session
- If no session found, user sees login/signup options

### 2. **Login Process**
- User clicks "Net Banking" or "Login"
- Redirected to `/login` page
- `AuthRedirect` component checks if already logged in
- If logged in → redirected to dashboard
- If not logged in → shows login form

### 3. **After Successful Login**
- Firebase authentication completes
- Session created and stored
- User redirected to dashboard
- All pages now show user-specific content

### 4. **Logged In State**
- Header shows user info + logout button
- Login/signup pages redirect to dashboard
- Protected routes accessible
- Session automatically refreshes on activity

## 🎯 User Experience Features

### **Smart Redirects**
```typescript
// Login page automatically redirects logged-in users
<AuthRedirect>
  <LoginForm />
</AuthRedirect>
```

### **Conditional UI Elements**
```typescript
// Header shows different content based on auth status
<AuthLinks variant="header" />
// Shows: "Sign Up" + "Net Banking" (not logged in)
// Shows: User avatar + "Dashboard" + logout (logged in)
```

### **Session Management**
- **Automatic refresh** on user activity
- **24-hour session timeout**
- **Secure logout** with Firebase signOut
- **Persistent sessions** across browser tabs

## 📱 Page-Specific Behavior

### **Home Page (`/`)**
- **Not logged in**: Shows login/signup buttons
- **Logged in**: Shows user info + dashboard link

### **Login Page (`/login`)**
- **Not logged in**: Shows login form
- **Logged in**: Redirects to dashboard with message

### **Signup Page (`/signup`)**
- **Not logged in**: Shows signup form
- **Logged in**: Redirects to dashboard with message

### **Dashboard (`/dashboard`)**
- **Not logged in**: Redirects to login
- **Logged in**: Shows dashboard content

## 🔧 Components Overview

### **AuthRedirect Component**
```typescript
// Wraps login/signup pages
<AuthRedirect>
  <LoginForm />
</AuthRedirect>
```

**Features:**
- ✅ Checks authentication status
- ✅ Shows loading state
- ✅ Redirects logged-in users
- ✅ Displays friendly redirect message

### **AuthLinks Component**
```typescript
// Replaces static login buttons
<AuthLinks variant="header" />
<AuthLinks variant="hero" />
<AuthLinks variant="card" />
```

**Variants:**
- **header**: Compact buttons for navigation
- **hero**: Large buttons for main CTAs
- **card**: Simple button for cards

### **ProtectedRoute Component**
```typescript
// Protects dashboard and other private pages
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

## 🛡️ Security Features

### **Session Security**
- **localStorage encryption** (in JWT version)
- **Automatic session cleanup**
- **Server-side validation** (JWT)
- **Token revocation** (JWT)

### **User Experience Security**
- **No sensitive data in URLs**
- **Secure logout process**
- **Session timeout warnings**
- **Activity-based refresh**

## 📊 Session Data Structure

```typescript
interface UserSession {
  user: User | null;           // Firebase user object
  customerId: string | null;    // Custom identifier
  isLoggedIn: boolean;          // Login status
  lastLogin: Date | null;       // Last activity
  sessionId: string | null;     // Unique session ID
}
```

## 🔄 State Management

### **AuthContext States**
```typescript
const {
  isLoggedIn,    // Boolean: user authentication status
  user,          // Firebase User object
  session,       // UserSession object
  customerId,    // String: custom user ID
  login,         // Function: handle login
  logout,        // Function: handle logout
  isLoading,     // Boolean: auth state loading
  refreshSession // Function: refresh session
} = useAuth();
```

## 🎨 UI/UX Patterns

### **Loading States**
- Spinner during authentication check
- Disabled buttons during login/signup
- Progress indicators for async operations

### **Error Handling**
- Clear error messages
- Retry mechanisms
- Graceful fallbacks

### **Success Feedback**
- Confirmation messages
- Automatic redirects
- Visual feedback

## 🚀 Implementation Examples

### **Adding Authentication to New Pages**
```typescript
// For public pages that should redirect logged-in users
import { AuthRedirect } from '@/components/AuthRedirect';

export default function PublicPage() {
  return (
    <AuthRedirect>
      <div>Public content</div>
    </AuthRedirect>
  );
}

// For private pages that require authentication
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function PrivatePage() {
  return (
    <ProtectedRoute>
      <div>Private content</div>
    </ProtectedRoute>
  );
}
```

### **Custom Auth Links**
```typescript
// Replace static buttons with dynamic auth links
import { AuthLinks } from '@/components/AuthLinks';

// In your component
<AuthLinks variant="header" className="my-custom-class" />
```

## 🔧 Configuration

### **Session Timeout**
```typescript
// Customize session timeout (default: 24 hours)
sessionManager.setSessionTimeout(12 * 60 * 60 * 1000); // 12 hours
```

### **Refresh Interval**
```typescript
// Customize refresh interval (default: 5 minutes)
useSessionRefresh(10 * 60 * 1000); // 10 minutes
```

## 🐛 Troubleshooting

### **Common Issues**

1. **User stuck on login page**
   - Check if session is valid
   - Clear localStorage and retry
   - Check Firebase configuration

2. **Session not persisting**
   - Verify localStorage is available
   - Check for browser privacy settings
   - Ensure Firebase auth is working

3. **Redirect loops**
   - Check AuthRedirect logic
   - Verify authentication state
   - Clear browser cache

### **Debug Mode**
```typescript
// Add to any component to debug auth state
const { isLoggedIn, user, session, isLoading } = useAuth();
console.log('Auth State:', { isLoggedIn, user, session, isLoading });
```

## 📈 Best Practices

1. **Always use AuthRedirect** for login/signup pages
2. **Use ProtectedRoute** for private content
3. **Replace static buttons** with AuthLinks
4. **Handle loading states** gracefully
5. **Provide clear feedback** for user actions
6. **Test authentication flow** thoroughly
7. **Monitor session health** in production

This authentication system provides a seamless, secure, and user-friendly experience across your entire application! 