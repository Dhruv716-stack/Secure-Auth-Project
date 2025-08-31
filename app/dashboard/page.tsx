"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { TopBar } from "@/components/dashboard/topbar"
import { SendMoneyCard } from "@/components/dashboard/send-money-card"
import { TransactionFeed } from "@/components/dashboard/transaction-feed"
import { AnomalyAlert } from "@/components/dashboard/anomaly-alert"
import { MapVisualization } from "@/components/dashboard/map-visualization"
import { AuthActivity } from "@/components/dashboard/auth-activity"
import { SpendingGraph } from "@/components/dashboard/spending-graph"
import { SessionInfo } from "@/components/SessionInfo"
import { useSessionBatch } from "@/hooks/useSessionBatch";
import { useAuth } from "@/contexts/AuthContext";
import { sessionManager } from "@/lib/session";

export default function DashboardPage() {
  const [showAnomalyAlert, setShowAnomalyAlert] = useState(true)
  const [currentRisk, setCurrentRisk] = useState<string | null>(null);
  // const { customerId } = useAuth();
  // let sessionId: string | null = null;
  // if (typeof window !== "undefined") {
  //   const session = sessionManager.getSession();
  //   sessionId = session?.sessionId || null;
  // }
  // if (customerId && sessionId) {
  //   useSessionBatch(customerId, sessionId);
  // }

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar (includes mobile sidebar) */}
        <TopBar />

        {/* Dashboard Grid */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-[1600px] mx-auto">
            {/* Section A: Send Money Simulation */}
            <div className="md:col-span-1">
              <SendMoneyCard currentRisk={currentRisk} />
            </div>

            {/* Section B: Transaction Feed */}
            <div className="md:col-span-1">
              <TransactionFeed />
            </div>

            {/* Section C: Anomaly Alert */}
            {showAnomalyAlert && (
              <div className="md:col-span-2 xl:col-span-1">
                <AnomalyAlert onDismiss={() => setShowAnomalyAlert(false)} onRiskChange={setCurrentRisk} />
              </div>
            )}

            {/* Section D: Map Visualization */}
            <div className={`md:col-span-2 ${!showAnomalyAlert ? "xl:col-span-2" : "xl:col-span-1"}`}>
              <MapVisualization />
            </div>

            {/* Section E: Auth Activity */}
            <div className="md:col-span-1">
              <AuthActivity />
            </div>

            {/* Section F: Spending Graph */}
            <div className="md:col-span-1">
              <SpendingGraph />
            </div>

            {/* Section G: Session Information */}
            <div className="md:col-span-1">
              <SessionInfo />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
