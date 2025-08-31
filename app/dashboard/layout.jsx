"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLayout;
const react_1 = __importDefault(require("react"));
const sidebar_1 = require("@/components/dashboard/sidebar");
function DashboardLayout({ children }) {
    return (<div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed positioning */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <sidebar_1.Sidebar />
      </div>
      {/* Main Content - scrollable if content overflows */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {children}
      </div>
    </div>);
}
