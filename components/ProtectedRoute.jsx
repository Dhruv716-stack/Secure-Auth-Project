"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtectedRoute = void 0;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const AuthContext_1 = require("@/contexts/AuthContext");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
    const { isLoggedIn, isLoading } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        if (!isLoading && !isLoggedIn) {
            router.push(redirectTo);
        }
    }, [isLoggedIn, isLoading, router, redirectTo]);
    return (<>
      {/* Always render children, but overlay loading or access denied UI if needed */}
      {children}
      {isLoading && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <lucide_react_1.Loader2 className="animate-spin h-10 w-10 text-blue-600"/>
        </div>)}
      {!isLoading && !isLoggedIn && (<div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <card_1.Card className="w-full max-w-md shadow-xl border-0">
            <card_1.CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide_react_1.Lock className="h-8 w-8 text-red-600"/>
              </div>
              <card_1.CardTitle className="text-xl font-bold text-gray-900">Access Denied</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                You need to be logged in to access this page. Please sign in to continue.
              </p>
              <div className="flex space-x-3">
                <button_1.Button onClick={() => router.push("/login")} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Sign In
                </button_1.Button>
                <button_1.Button variant="outline" onClick={() => router.push("/")} className="flex-1">
                  Go Home
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>)}
    </>);
};
exports.ProtectedRoute = ProtectedRoute;
