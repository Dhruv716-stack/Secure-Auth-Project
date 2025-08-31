"use strict";
"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpendingGraph = SpendingGraph;
const card_1 = require("@/components/ui/card");
const recharts_1 = require("recharts");
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const categories = [
    { name: "Food & Dining", color: "#3B82F6" },
    { name: "Shopping", color: "#10B981" },
    { name: "Transportation", color: "#F59E0B" },
    { name: "Entertainment", color: "#EF4444" },
    { name: "Bills", color: "#8B5CF6" },
];
function SpendingGraph() {
    const [spendingData, setSpendingData] = (0, react_1.useState)(categories.map(c => ({ name: c.name, value: 0, color: c.color })));
    const [trendData, setTrendData] = (0, react_1.useState)([]); // <-- dynamic trend data
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        function fetchTransactions() {
            return __awaiter(this, void 0, void 0, function* () {
                setLoading(true);
                try {
                    const res = yield fetch("/api/transactions");
                    const data = yield res.json();
                    if (res.ok && data.transactions) {
                        // Group by category for pie chart
                        const sums = {};
                        for (const cat of categories)
                            sums[cat.name] = 0;
                        for (const tx of data.transactions) {
                            if (tx.category && sums.hasOwnProperty(tx.category)) {
                                sums[tx.category] += Number(tx.amount);
                            }
                        }
                        setSpendingData(categories.map(c => ({ name: c.name, value: sums[c.name], color: c.color })));
                        // Group by day for trend line chart
                        const daySums = {};
                        for (const tx of data.transactions) {
                            if (!tx.createdAt)
                                continue;
                            const date = new Date(tx.createdAt);
                            // Format as YYYY-MM-DD
                            const day = date.toISOString().slice(0, 10);
                            if (!daySums[day])
                                daySums[day] = 0;
                            daySums[day] += Number(tx.amount);
                        }
                        // Convert to array sorted by day
                        const trendArr = Object.entries(daySums)
                            .map(([day, amount]) => ({ day, amount }))
                            .sort((a, b) => a.day.localeCompare(b.day));
                        setTrendData(trendArr);
                    }
                }
                catch (e) {
                    // fallback: do nothing
                }
                finally {
                    setLoading(false);
                }
            });
        }
        fetchTransactions();
    }, []);
    return (<card_1.Card className="h-full">
      <card_1.CardHeader className="pb-3 md:pb-4">
        <card_1.CardTitle className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <lucide_react_1.TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-orange-600"/>
          </div>
          <span className="text-base md:text-lg font-semibold">Spending Analysis</span>
        </card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="space-y-4 md:space-y-6">
          {/* Pie Chart */}
          <div>
            <h4 className="text-xs md:text-sm font-medium mb-2 md:mb-3">Category Breakdown</h4>
            <div className="h-[120px] md:h-[150px]">
              <recharts_1.ResponsiveContainer width="100%" height="100%">
                <recharts_1.PieChart>
                  <recharts_1.Pie data={spendingData} cx="50%" cy="50%" innerRadius={20} outerRadius={50} paddingAngle={2} dataKey="value">
                    {spendingData.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={entry.color}/>))}
                  </recharts_1.Pie>
                  <recharts_1.Tooltip formatter={(value) => [`₹${value}`, "Amount"]}/>
                </recharts_1.PieChart>
              </recharts_1.ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart */}
          <div>
            <h4 className="text-xs md:text-sm font-medium mb-2 md:mb-3">Spending Trend (per day)</h4>
            <div className="h-[100px] md:h-[120px]">
              <recharts_1.ResponsiveContainer width="100%" height="100%">
                <recharts_1.LineChart data={trendData}>
                  <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <recharts_1.XAxis dataKey="day" tick={{ fontSize: 10 }}/>
                  <recharts_1.YAxis tick={{ fontSize: 10 }}/>
                  <recharts_1.Tooltip formatter={(value) => [`₹${value}`, "Amount"]} labelFormatter={label => `Date: ${label}`}/>
                  <recharts_1.Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", strokeWidth: 2, r: 3 }}/>
                </recharts_1.LineChart>
              </recharts_1.ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 text-xs">
            {spendingData.map((item) => (<div key={item.name} className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="truncate">{item.name} ({item.value === 0 ? '0' : `₹${item.value}`})</span>
              </div>))}
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
