"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

const categories = [
  { name: "Food & Dining", color: "#3B82F6" },
  { name: "Shopping", color: "#10B981" },
  { name: "Transportation", color: "#F59E0B" },
  { name: "Entertainment", color: "#EF4444" },
  { name: "Bills", color: "#8B5CF6" },
];

export function SpendingGraph() {
  const [spendingData, setSpendingData] = useState(categories.map(c => ({ name: c.name, value: 0, color: c.color })));
  const [trendData, setTrendData] = useState([]); // <-- dynamic trend data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        if (res.ok && data.transactions) {
          // Group by category for pie chart
          const sums = {};
          for (const cat of categories) sums[cat.name] = 0;
          for (const tx of data.transactions) {
            if (tx.category && sums.hasOwnProperty(tx.category)) {
              sums[tx.category] += Number(tx.amount);
            }
          }
          setSpendingData(categories.map(c => ({ name: c.name, value: sums[c.name], color: c.color })));

          // Group by day for trend line chart
          const daySums = {};
          for (const tx of data.transactions) {
            if (!tx.createdAt) continue;
            const date = new Date(tx.createdAt);
            // Format as YYYY-MM-DD
            const day = date.toISOString().slice(0, 10);
            if (!daySums[day]) daySums[day] = 0;
            daySums[day] += Number(tx.amount);
          }
          // Convert to array sorted by day
          const trendArr = Object.entries(daySums)
            .map(([day, amount]) => ({ day, amount }))
            .sort((a, b) => a.day.localeCompare(b.day));
          setTrendData(trendArr);
        }
      } catch (e) {
        // fallback: do nothing
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
          </div>
          <span className="text-base md:text-lg font-semibold">Spending Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 md:space-y-6">
          {/* Pie Chart */}
          <div>
            <h4 className="text-xs md:text-sm font-medium mb-2 md:mb-3">Category Breakdown</h4>
            <div className="h-[120px] md:h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {spendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart */}
          <div>
            <h4 className="text-xs md:text-sm font-medium mb-2 md:mb-3">Spending Trend (per day)</h4>
            <div className="h-[100px] md:h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} labelFormatter={label => `Date: ${label}`} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 text-xs">
            {spendingData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div
                  className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="truncate">{item.name} ({item.value === 0 ? '0' : `₹${item.value}`})</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
