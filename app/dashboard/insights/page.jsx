"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InsightsPage;
const react_1 = __importDefault(require("react"));
const ProtectedRoute_1 = require("@/components/ProtectedRoute");
const spending_graph_1 = require("@/components/dashboard/spending-graph");
function InsightsPage() {
    return (<ProtectedRoute_1.ProtectedRoute>
      <div className="w-full min-h-0 flex flex-col items-center py-6 px-2 md:px-6">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-yellow-800">Risk Insights & Spending Analysis</h1>
          <p className="text-gray-500 mb-4 md:mb-6">Analyze your spending and get tips to keep your account safe.</p>
          <div className="flex flex-col gap-4">
            <spending_graph_1.SpendingGraph />
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-yellow-100">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-yellow-700">Insights & Tips</h2>
              <ul className="space-y-2 md:space-y-3 text-sm text-gray-700">
                <li>• Monitor your spending trends to detect unusual activity</li>
                <li>• Set up alerts for high-value transactions</li>
                <li>• Diversify your spending to reduce risk</li>
                <li>• Review your monthly statements for anomalies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute_1.ProtectedRoute>);
}
