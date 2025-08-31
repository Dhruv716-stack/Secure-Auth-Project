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
exports.TransactionFeed = TransactionFeed;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const scroll_area_1 = require("@/components/ui/scroll-area");
const lucide_react_1 = require("lucide-react");
function TransactionFeed() {
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        function fetchTransactions() {
            return __awaiter(this, void 0, void 0, function* () {
                setLoading(true);
                try {
                    const res = yield fetch("/api/transactions", { method: "GET" });
                    const data = yield res.json();
                    setTransactions(data.transactions || []);
                }
                catch (_a) {
                    setTransactions([]);
                }
                finally {
                    setLoading(false);
                }
            });
        }
        fetchTransactions();
    }, []);
    return (<card_1.Card className="h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <card_1.CardHeader className="pb-3 md:pb-4">
        <card_1.CardTitle className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <lucide_react_1.CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-600"/>
          </div>
          <div className="min-w-0">
            <div className="text-base md:text-lg font-semibold text-gray-900">Transaction Feed</div>
            <div className="text-xs md:text-sm text-gray-500">Recent transactions</div>
          </div>
        </card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="p-0">
        <scroll_area_1.ScrollArea className="h-[300px] md:h-[400px] px-4 md:px-6">
          <div className="space-y-3 md:space-y-4 pb-4">
            {loading ? (<div className="text-center text-gray-400 py-8">Loading...</div>) : transactions.length === 0 ? (<div className="text-center text-gray-400 py-8">No transactions found.</div>) : (transactions.map((transaction) => (<div key={transaction.id} className="p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base md:text-lg text-gray-900 truncate">
                        ₹{transaction.amount}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        to {transaction.recipientId || transaction.receiver}
                      </p>
                    </div>
                    <badge_1.Badge variant={transaction.status === "completed" ? "secondary" : "destructive"} className={`ml-2 flex-shrink-0 text-xs ${transaction.status === "completed"
                ? "bg-green-100 text-green-800 border-green-200 rounded-md md:rounded-lg"
                : "bg-red-100 text-red-800 border-red-200 rounded-md md:rounded-lg"}`}>
                      {transaction.status}
                    </badge_1.Badge>
                  </div>
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <lucide_react_1.MapPin className="h-3 w-3 text-blue-500 flex-shrink-0"/>
                      <span className="truncate">{transaction.location || "Unknown"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <lucide_react_1.Smartphone className="h-3 w-3 text-purple-500 flex-shrink-0"/>
                      <span className="truncate">{transaction.device || "Unknown Device"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <lucide_react_1.Globe className="h-3 w-3 text-gray-400 flex-shrink-0"/>
                      <span className="truncate">{transaction.ip || "Unknown IP"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <lucide_react_1.User className="h-3 w-3 text-gray-400 flex-shrink-0"/>
                      <span className="truncate">Customer ID: {transaction.customerId || "-"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <lucide_react_1.Clock className="h-3 w-3 text-yellow-500 flex-shrink-0"/>
                      <span>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "-"}</span>
                    </div>
                  </div>
                </div>)))}
          </div>
        </scroll_area_1.ScrollArea>
      </card_1.CardContent>
    </card_1.Card>);
}
