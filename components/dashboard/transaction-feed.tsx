"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CreditCard, MapPin, Smartphone, Clock, Globe, User } from "lucide-react"

export function TransactionFeed() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      try {
        const res = await fetch("/api/transactions", { method: "GET" })
        const data = await res.json()
        setTransactions(data.transactions || [])
      } catch {
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  return (
    <Card className="h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <div className="text-base md:text-lg font-semibold text-gray-900">Transaction Feed</div>
            <div className="text-xs md:text-sm text-gray-500">Recent transactions</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] md:h-[400px] px-4 md:px-6">
          <div className="space-y-3 md:space-y-4 pb-4">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No transactions found.</div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base md:text-lg text-gray-900 truncate">
                        ₹{transaction.amount}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        to {transaction.recipientId || transaction.receiver}
                      </p>
                    </div>
                    <Badge
                      variant={transaction.status === "completed" ? "secondary" : "destructive"}
                      className={`ml-2 flex-shrink-0 text-xs ${
                        transaction.status === "completed"
                          ? "bg-green-100 text-green-800 border-green-200 rounded-md md:rounded-lg"
                          : "bg-red-100 text-red-800 border-red-200 rounded-md md:rounded-lg"
                      }`}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{transaction.location || "Unknown"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      <span className="truncate">{transaction.device || "Unknown Device"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{transaction.ip || "Unknown IP"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">Customer ID: {transaction.customerId || "-"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      <span>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "-"}</span>
                    </div>
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
