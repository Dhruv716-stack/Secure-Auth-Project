"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  BarChart3,
  CreditCard,
  AlertTriangle,
  Shield,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Building2,
  X,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, color: "text-blue-600" },
  { name: "Transactions", href: "/dashboard/transactions", icon: CreditCard, color: "text-green-600" },
  { name: "Anomaly Alerts", href: "/dashboard/alerts", icon: AlertTriangle, color: "text-red-600" },
  { name: "Auth Activity", href: "/dashboard/auth", icon: Shield, color: "text-purple-600" },
  { name: "Risk Insights", href: "/dashboard/insights", icon: TrendingUp, color: "text-yellow-600" },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function Sidebar({ isOpen = false, onClose, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { logout, customerId } = useAuth()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm",
          // Mobile styles
          "fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop styles - ensure proper width
          collapsed ? "lg:w-20" : "w-72 lg:w-72",
          // Height should be full screen
          "h-screen lg:h-screen",
          className,
        )}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center space-x-2 lg:space-x-3 min-w-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base lg:text-lg font-bold text-gray-900 truncate">SecureBank</h1>
                <p className="text-xs text-gray-500">Fraud Detection</p>
              </div>
            </div>
          )}

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 lg:p-6 space-y-1 lg:space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose} // Close mobile sidebar on navigation
                className={cn(
                  "flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  collapsed && "lg:justify-center lg:px-3",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0",
                    !collapsed && "mr-2 lg:mr-3",
                    isActive ? "text-blue-600" : item.color,
                  )}
                />
                {!collapsed && (
                  <span className={cn("truncate", isActive ? "text-blue-700" : "text-gray-700")}>{item.name}</span>
                )}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info and Logout */}
        <div className="p-4 lg:p-6 border-t border-gray-200 flex-shrink-0">
          {!collapsed && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-900">Welcome back!</div>
              <div className="text-xs text-gray-500">Customer ID: {customerId || "Loading..."}</div>
            </div>
          )}
          
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className={cn(
              "w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700",
              collapsed && "lg:justify-center lg:px-3"
            )}
          >
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && "Sign Out"}
          </Button>
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 lg:px-6 pb-4 lg:pb-6">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">SecureBank Dashboard</div>
              <div className="text-xs text-gray-400">v2.0.1</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
