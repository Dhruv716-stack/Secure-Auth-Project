"use client";
import React, { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AnomalyAlert } from "@/components/dashboard/anomaly-alert";

export default function AlertsPage() {
  const [showAlert, setShowAlert] = useState(true);
  return (
    <ProtectedRoute>
      <div className="w-full min-h-0 flex flex-col items-center py-6 px-2 md:px-6">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-red-800">Anomaly Alerts</h1>
          <p className="text-gray-500 mb-4 md:mb-6">Monitor and respond to suspicious activity on your account.</p>
          <div className="flex flex-col gap-4">
            {showAlert && <AnomalyAlert onDismiss={() => setShowAlert(false)} />}
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
    </ProtectedRoute>
  );
} 