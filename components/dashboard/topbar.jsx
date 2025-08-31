"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopBar = TopBar;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const avatar_1 = require("@/components/ui/avatar");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const notification_bell_1 = require("@/components/dashboard/notification-bell");
const sidebar_1 = require("@/components/dashboard/sidebar");
const AuthContext_1 = require("@/contexts/AuthContext");
function TopBar() {
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(false);
    const { logout, customerId, user } = (0, AuthContext_1.useAuth)();
    // Get initials from customer ID
    const getInitials = (id) => {
        return id.slice(0, 2).toUpperCase();
    };
    return (<>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
            {/* Mobile menu button */}
            <button_1.Button variant="ghost" size="sm" className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
              <lucide_react_1.Menu className="h-5 w-5"/>
            </button_1.Button>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Fraud Detection Dashboard</h2>
              <p className="text-xs md:text-sm text-gray-500 hidden sm:block">
                Monitor and analyze banking transactions in real-time
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            {/* Notification Bell */}
            <notification_bell_1.NotificationBell />

            {/* User Menu */}
            <dropdown_menu_1.DropdownMenu>
              <dropdown_menu_1.DropdownMenuTrigger asChild>
                <button_1.Button variant="ghost" className="flex items-center space-x-2 md:space-x-3 hover:bg-gray-50 rounded-xl px-2 md:px-4 py-2">
                  <avatar_1.Avatar className="h-8 w-8 md:h-9 md:w-9">
                    <avatar_1.AvatarImage src={(user === null || user === void 0 ? void 0 : user.profileImage) || "/placeholder.svg"} alt="User"/>
                    <avatar_1.AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                      {customerId ? getInitials(customerId) : "CB"}
                    </avatar_1.AvatarFallback>
                  </avatar_1.Avatar>
                  <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-gray-900">Canara Bank</div>
                    <div className="text-sm font-medium text-gray-600">{(user === null || user === void 0 ? void 0 : user.name) || 'User'}</div>
                    <div className="text-xs text-gray-500">Customer ID: {customerId || "Loading..."}</div>
                  </div>
                </button_1.Button>
              </dropdown_menu_1.DropdownMenuTrigger>
              <dropdown_menu_1.DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-xl">
                <dropdown_menu_1.DropdownMenuLabel className="text-gray-700">My Account</dropdown_menu_1.DropdownMenuLabel>
                <dropdown_menu_1.DropdownMenuSeparator />
                <dropdown_menu_1.DropdownMenuItem className="hover:bg-gray-50 rounded-lg mx-1">
                  <lucide_react_1.User className="mr-2 h-4 w-4 text-gray-500"/>
                  Profile
                </dropdown_menu_1.DropdownMenuItem>
                <dropdown_menu_1.DropdownMenuItem className="hover:bg-gray-50 rounded-lg mx-1">
                  <lucide_react_1.Settings className="mr-2 h-4 w-4 text-gray-500"/>
                  Settings
                </dropdown_menu_1.DropdownMenuItem>
                <dropdown_menu_1.DropdownMenuSeparator />
                <dropdown_menu_1.DropdownMenuItem onClick={logout} className="flex items-center hover:bg-red-50 text-red-600 rounded-lg mx-1 cursor-pointer">
                  <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
                  Logout
                </dropdown_menu_1.DropdownMenuItem>
              </dropdown_menu_1.DropdownMenuContent>
            </dropdown_menu_1.DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <sidebar_1.Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} className="lg:hidden"/>
    </>);
}
