"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
const react_1 = require("react");
const ProtectedRoute_1 = require("@/components/ProtectedRoute");
const topbar_1 = require("@/components/dashboard/topbar");
const send_money_card_1 = require("@/components/dashboard/send-money-card");
const transaction_feed_1 = require("@/components/dashboard/transaction-feed");
const anomaly_alert_1 = require("@/components/dashboard/anomaly-alert");
const map_visualization_1 = require("@/components/dashboard/map-visualization");
const auth_activity_1 = require("@/components/dashboard/auth-activity");
const spending_graph_1 = require("@/components/dashboard/spending-graph");
const SessionInfo_1 = require("@/components/SessionInfo");
function DashboardPage() {
    const [showAnomalyAlert, setShowAnomalyAlert] = (0, react_1.useState)(true);
    // const { customerId } = useAuth();
    // let sessionId: string | null = null;
    // if (typeof window !== "undefined") {
    //   const session = sessionManager.getSession();
    //   sessionId = session?.sessionId || null;
    // }
    // if (customerId && sessionId) {
    //   useSessionBatch(customerId, sessionId);
    // }
    return (<ProtectedRoute_1.ProtectedRoute>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar (includes mobile sidebar) */}
        <topbar_1.TopBar />

        {/* Dashboard Grid */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-[1600px] mx-auto">
            {/* Section A: Send Money Simulation */}
            <div className="md:col-span-1">
              <send_money_card_1.SendMoneyCard />
            </div>

            {/* Section B: Transaction Feed */}
            <div className="md:col-span-1">
              <transaction_feed_1.TransactionFeed />
            </div>

            {/* Section C: Anomaly Alert */}
            {showAnomalyAlert && (<div className="md:col-span-2 xl:col-span-1">
                <anomaly_alert_1.AnomalyAlert onDismiss={() => setShowAnomalyAlert(false)}/>
              </div>)}

            {/* Section D: Map Visualization */}
            <div className={`md:col-span-2 ${!showAnomalyAlert ? "xl:col-span-2" : "xl:col-span-1"}`}>
              <map_visualization_1.MapVisualization />
            </div>

            {/* Section E: Auth Activity */}
            <div className="md:col-span-1">
              <auth_activity_1.AuthActivity />
            </div>

            {/* Section F: Spending Graph */}
            <div className="md:col-span-1">
              <spending_graph_1.SpendingGraph />
            </div>

            {/* Section G: Session Information */}
            <div className="md:col-span-1">
              <SessionInfo_1.SessionInfo />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute_1.ProtectedRoute>);
}
