"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRedirect = void 0;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const AuthContext_1 = require("@/contexts/AuthContext");
const AuthRedirect = ({ children, redirectTo = "/dashboard" }) => {
    const { isLoggedIn, isLoading } = (0, AuthContext_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const [showBanner, setShowBanner] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (!isLoading && isLoggedIn) {
            setShowBanner(true);
            const timer = setTimeout(() => {
                setShowBanner(false);
                router.push(redirectTo);
            }, 1000); // Reduced from 1500ms to 1000ms
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, isLoading, router, redirectTo]);
    return (<>
      {showBanner && (<div className="fixed top-0 left-0 w-full z-50 bg-green-600 text-white flex items-center justify-center py-2 px-4 shadow-md animate-fade-in-down">
          <lucide_react_1.CheckCircle className="h-5 w-5 mr-2 text-white"/>
          <span className="font-medium">You are already logged in. Redirecting to dashboard...</span>
          <lucide_react_1.Loader2 className="h-4 w-4 ml-2 animate-spin"/>
        </div>)}
      {children}
    </>);
};
exports.AuthRedirect = AuthRedirect;
