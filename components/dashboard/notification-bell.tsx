"use client"

import { useEffect, useState } from "react"
import { useRef } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const popoverOpen = useRef(false);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const alertCount = notifications.filter((n) => n.type === "alert" && !n.read).length;

  // Mark all as read when popover opens
  const handleOpenChange = async (open: boolean) => {
    if (open && !popoverOpen.current) {
      popoverOpen.current = true;
      await fetch("/api/notifications", { method: "PATCH" });
      // Refetch notifications to update state
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } else if (!open) {
      popoverOpen.current = false;
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          {alertCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {alertCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 md:w-80" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm md:text-base">Notifications</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No notifications.</div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`p-3 rounded-lg border bg-gray-50 ${notification.type === 'alert' ? 'border-red-300' : notification.type === 'success' ? 'border-green-300' : ''}`}>
                <p className="text-xs md:text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p>
              </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
