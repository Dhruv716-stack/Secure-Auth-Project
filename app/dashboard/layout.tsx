import React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed positioning */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>
      {/* Main Content - scrollable if content overflows */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
} 