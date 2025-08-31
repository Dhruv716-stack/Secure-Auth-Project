"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AlertsPage;
const react_1 = __importStar(require("react"));
const ProtectedRoute_1 = require("@/components/ProtectedRoute");
const anomaly_alert_1 = require("@/components/dashboard/anomaly-alert");
function AlertsPage() {
    const [showAlert, setShowAlert] = (0, react_1.useState)(true);
    return (<ProtectedRoute_1.ProtectedRoute>
      <div className="w-full min-h-0 flex flex-col items-center py-6 px-2 md:px-6">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-red-800">Anomaly Alerts</h1>
          <p className="text-gray-500 mb-4 md:mb-6">Monitor and respond to suspicious activity on your account.</p>
          <div className="flex flex-col gap-4">
            {showAlert && <anomaly_alert_1.AnomalyAlert onDismiss={() => setShowAlert(false)}/>}
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-red-100">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-red-700">Recent Alerts</h2>
              <ul className="space-y-2 md:space-y-3 text-sm text-gray-700">
                <li>• Large transfer to unknown recipient flagged for review</li>
                <li>• Login attempt from new device in Mumbai</li>
                <li>• Multiple failed login attempts detected</li>
                <li>• Transaction at unusual hour (3:00 AM)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute_1.ProtectedRoute>);
}
