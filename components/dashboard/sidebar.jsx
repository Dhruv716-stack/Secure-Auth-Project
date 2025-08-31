"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = Sidebar;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const utils_1 = require("@/lib/utils");
const AuthContext_1 = require("@/contexts/AuthContext");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: lucide_react_1.BarChart3, color: "text-blue-600" },
    { name: "Transactions", href: "/dashboard/transactions", icon: lucide_react_1.CreditCard, color: "text-green-600" },
    { name: "Anomaly Alerts", href: "/dashboard/alerts", icon: lucide_react_1.AlertTriangle, color: "text-red-600" },
    { name: "Auth Activity", href: "/dashboard/auth", icon: lucide_react_1.Shield, color: "text-purple-600" },
    { name: "Risk Insights", href: "/dashboard/insights", icon: lucide_react_1.TrendingUp, color: "text-yellow-600" },
];
function Sidebar({ isOpen = false, onClose, className }) {
    const [collapsed, setCollapsed] = (0, react_1.useState)(false);
    const pathname = (0, navigation_1.usePathname)();
    const { logout, customerId } = (0, AuthContext_1.useAuth)();
    return (<>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose}/>}

      {/* Sidebar */}
      <div className={(0, utils_1.cn)("bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm", 
        // Mobile styles
        "fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0", isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", 
        // Desktop styles - ensure proper width
        collapsed ? "lg:w-20" : "w-72 lg:w-72", 
        // Height should be full screen
        "h-screen lg:h-screen", className)}>
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          {!collapsed && (<div className="flex items-center space-x-2 lg:space-x-3 min-w-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <lucide_react_1.Building2 className="h-4 w-4 lg:h-6 lg:w-6 text-white"/>
              </div>
              <div className="min-w-0">
                <h1 className="text-base lg:text-lg font-bold text-gray-900 truncate">SecureBank</h1>
                <p className="text-xs text-gray-500">Fraud Detection</p>
              </div>
            </div>)}

          {/* Mobile close button */}
          <button_1.Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
            <lucide_react_1.X className="h-4 w-4"/>
          </button_1.Button>

          {/* Desktop collapse button */}
          <button_1.Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
            {collapsed ? <lucide_react_1.ChevronRight className="h-4 w-4"/> : <lucide_react_1.ChevronLeft className="h-4 w-4"/>}
          </button_1.Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 lg:p-6 space-y-1 lg:space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (<link_1.default key={item.name} href={item.href} onClick={onClose} // Close mobile sidebar on navigation
             className={(0, utils_1.cn)("flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-sm font-medium transition-all group", isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50", collapsed && "lg:justify-center lg:px-3")}>
                <item.icon className={(0, utils_1.cn)("h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0", !collapsed && "mr-2 lg:mr-3", isActive ? "text-blue-600" : item.color)}/>
                {!collapsed && (<span className={(0, utils_1.cn)("truncate", isActive ? "text-blue-700" : "text-gray-700")}>{item.name}</span>)}
                {!collapsed && isActive && (<div className="ml-auto w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-600 rounded-full flex-shrink-0"></div>)}
              </link_1.default>);
        })}
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 lg:p-6 border-t border-gray-200 flex-shrink-0">
          {!collapsed && (<div className="mb-4">
              <div className="text-sm font-medium text-gray-900">Welcome back!</div>
              <div className="text-xs text-gray-500">Customer ID: {customerId || "Loading..."}</div>
            </div>)}
          
          <button_1.Button onClick={logout} variant="outline" size="sm" className={(0, utils_1.cn)("w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700", collapsed && "lg:justify-center lg:px-3")}>
            <lucide_react_1.LogOut className={(0, utils_1.cn)("h-4 w-4", !collapsed && "mr-2")}/>
            {!collapsed && "Sign Out"}
          </button_1.Button>
        </div>

        {/* Footer */}
        {!collapsed && (<div className="px-4 lg:px-6 pb-4 lg:pb-6">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">SecureBank Dashboard</div>
              <div className="text-xs text-gray-400">v2.0.1</div>
            </div>
          </div>)}
      </div>
    </>);
}
