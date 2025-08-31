"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TransactionsPage;
const react_1 = __importDefault(require("react"));
const ProtectedRoute_1 = require("@/components/ProtectedRoute");
const send_money_card_1 = require("@/components/dashboard/send-money-card");
const transaction_feed_1 = require("@/components/dashboard/transaction-feed");
const map_visualization_1 = require("@/components/dashboard/map-visualization");
function TransactionsPage() {
    return (<ProtectedRoute_1.ProtectedRoute>
      <div className="w-full min-h-0 flex flex-col items-center py-6 px-2 md:px-6">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-blue-800">Transactions</h1>
          <p className="text-gray-500 mb-4 md:mb-6">View and manage your recent transactions, send money, and see transaction locations.</p>
          <div className="flex flex-col gap-4">
            <send_money_card_1.SendMoneyCard />
            <transaction_feed_1.TransactionFeed />
            <map_visualization_1.MapVisualization />
          </div>
        </div>
      </div>
    </ProtectedRoute_1.ProtectedRoute>);
}
