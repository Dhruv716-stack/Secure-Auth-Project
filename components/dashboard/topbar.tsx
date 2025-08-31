"use client"

import { useState } from "react"
import { LogOut, User, Settings, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useAuth } from "@/contexts/AuthContext"

export function TopBar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout, customerId, user } = useAuth()

  // Get initials from customer ID
  const getInitials = (id: string) => {
    return id.slice(0, 2).toUpperCase()
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Fraud Detection Dashboard</h2>
              <p className="text-xs md:text-sm text-gray-500 hidden sm:block">
                Monitor and analyze banking transactions in real-time
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 md:space-x-3 hover:bg-gray-50 rounded-xl px-2 md:px-4 py-2"
                >
                  <Avatar className="h-8 w-8 md:h-9 md:w-9">
                    <AvatarImage src={user?.profileImage || "/placeholder.svg"} alt="User" />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                      {customerId ? getInitials(customerId) : "CB"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-gray-900">Canara Bank</div>
                    <div className="text-sm font-medium text-gray-600">{user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">Customer ID: {customerId || "Loading..."}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-xl">
                <DropdownMenuLabel className="text-gray-700">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-gray-50 rounded-lg mx-1">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-50 rounded-lg mx-1">
                  <Settings className="mr-2 h-4 w-4 text-gray-500" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="flex items-center hover:bg-red-50 text-red-600 rounded-lg mx-1 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} className="lg:hidden" />
    </>
  )
}
