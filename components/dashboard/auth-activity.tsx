"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Smartphone, Monitor, CheckCircle, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

export function AuthActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      try {
        const res = await fetch("/api/auth-activity");
        const data = await res.json();
        setActivities(data.activities || []);
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  return (
    <Card className="h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
          </div>
          <span className="text-base md:text-lg font-semibold">Auth Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] md:h-[400px] px-4 md:px-6">
          <div className="space-y-2 md:space-y-3">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : activities.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No auth activity found.</div>
            ) : (
              activities.map((activity) => (
              <div key={activity.id} className="p-3 rounded-lg border bg-white">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {activity.device && (activity.device.includes("iPhone") || activity.device.includes("Android")) ? (
                      <Smartphone className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                    ) : (
                      <Monitor className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-xs md:text-sm truncate">{activity.type}</span>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                    {activity.status === "Success" ? (
                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                    )}
                    <Badge
                      variant={activity.status === "Success" ? "secondary" : "destructive"}
                      className={`text-xs ${activity.status === "Success" ? "bg-green-100 text-green-800" : ""}`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500 mt-1">
                    <p className="truncate">IP: {activity.ip || "-"}</p>
                    <p className="truncate">Device: {activity.device || "-"}</p>
                    <p className="truncate">Location: {activity.location || "-"}</p>
                    <span className="text-xs">{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : "-"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
