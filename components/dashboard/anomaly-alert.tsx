"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, X, MapPin, Clock, Shield } from "lucide-react"

interface AnomalyAlertProps {
  onDismiss: () => void
  onRiskChange?: (risk: string | null) => void
}

export function AnomalyAlert({ onDismiss, onRiskChange }: AnomalyAlertProps) {
  const [anomaly, setAnomaly] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let interval: NodeJS.Timeout;
    async function fetchAnomaly() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/model-output");
        const data = await res.json();
        let risk: string | null = null;
        if (res.ok && data.outputs && data.outputs.length > 0) {
          setAnomaly(data.outputs[0]);
          const score = data.outputs[0].anomalyScore;
          if (score == null || score < 0.33) risk = null;
          else if (score < 0.45) risk = "Low";
          else if (score < 0.75) risk = "Medium";
          else risk = "High";
        } else {
          setAnomaly(null);
        }
        if (onRiskChange) onRiskChange(risk);
      } catch (e) {
        setError("Failed to fetch anomaly data");
        if (onRiskChange) onRiskChange(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAnomaly();
    interval = setInterval(fetchAnomaly, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [hydrated, onRiskChange]);

  if (!hydrated) {
    return (
      <Card className="h-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
        <span className="text-gray-700 text-sm">Loading...</span>
      </Card>
    );
  }
  if (loading) {
    return (
      <Card className="h-full border-2 border-red-200 bg-red-50 flex items-center justify-center">
        <span className="text-red-700 text-sm">Loading anomaly data...</span>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="h-full border-2 border-red-200 bg-red-50 flex items-center justify-center">
        <span className="text-red-700 text-sm">{error}</span>
      </Card>
    );
  }
  if (!anomaly || anomaly.anomalyScore == null || anomaly.anomalyScore < 0.33) {
    return (
      <Card className="h-full border-2 border-green-200 bg-green-50 flex items-center justify-center">
        <span className="text-green-700 text-sm">No recent anomalies detected.</span>
      </Card>
    );
  }

  // Determine risk level and colors
  let riskLevel = "Low";
  let cardBorder = "border-yellow-200";
  let cardBg = "bg-yellow-50";
  let textColor = "text-yellow-800";
  let badgeColor = "bg-yellow-200 text-yellow-800 border-yellow-300";
  if (anomaly.anomalyScore >= 0.45 && anomaly.anomalyScore < 0.75) {
    riskLevel = "Medium";
    cardBorder = "border-red-200";
    cardBg = "bg-red-50";
    textColor = "text-red-800";
    badgeColor = "bg-red-200 text-red-800 border-red-300";
  } else if (anomaly.anomalyScore >= 0.75) {
    riskLevel = "High";
    cardBorder = "border-red-400";
    cardBg = "bg-red-100";
    textColor = "text-red-900";
    badgeColor = "bg-red-400 text-red-900 border-red-500";
  }

  return (
    <Card className={`h-full border-2 ${cardBorder} ${cardBg} shadow-sm hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center space-x-2 md:space-x-3 min-w-0 flex-1 ${textColor}`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 ${cardBg} rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className={`h-4 w-4 md:h-5 md:w-5 ${textColor}`} />
            </div>
            <div className="min-w-0">
              <div className={`text-base md:text-lg font-semibold ${textColor}`}>Anomaly Detected</div>
              <div className={`text-xs md:text-sm ${textColor}`}>Requires immediate attention</div>
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className={`${textColor} hover:${cardBg} rounded-lg p-2 flex-shrink-0`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        <div className="space-y-3 md:space-y-4">
          <div className={`bg-white p-3 md:p-4 rounded-lg md:rounded-xl border ${cardBorder}`}>
            <h4 className={`font-semibold ${textColor} mb-2 flex items-center text-sm md:text-base`}>
              <Shield className="h-3 w-3 md:h-4 md:w-4 mr-2 flex-shrink-0" />
              {anomaly.riskCategory || riskLevel}
            </h4>
            <p className="text-xs md:text-sm text-red-700">
              {anomaly.riskReasons || "Anomalous behavior detected by the system."}
            </p>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            <Badge variant="destructive" className={`${badgeColor} rounded-lg text-xs`}>
              {anomaly.anomalyScore != null ? anomaly.anomalyScore.toFixed(2) : "-"}
            </Badge>
            <span className={`text-xs md:text-sm font-medium ${textColor}`}>Anomaly Score</span>
          </div>

          <div className="space-y-2 md:space-y-3">
            <div className={`flex items-center space-x-2 md:space-x-3 bg-white p-2 md:p-3 rounded-lg md:rounded-xl border ${cardBorder}`}>
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-xs md:text-sm font-medium text-gray-900">Session ID:</span>
                <span className="text-xs md:text-sm text-red-700 ml-1">{anomaly.sessionId || "-"}</span>
              </div>
            </div>
            <div className={`flex items-center space-x-2 md:space-x-3 bg-white p-2 md:p-3 rounded-lg md:rounded-xl border ${cardBorder}`}>
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-xs md:text-sm font-medium text-gray-900">Customer ID:</span>
                <span className="text-xs md:text-sm text-red-700 ml-1">{anomaly.customerId || "-"}</span>
              </div>
            </div>
          </div>

          <div className={`bg-white p-3 md:p-4 rounded-lg md:rounded-xl border ${cardBorder}`}>
            <p className={`text-xs md:text-sm ${textColor} font-semibold mb-2 md:mb-3`}>⚠️ Risk Factors:</p>
            <ul className="text-xs md:text-sm text-red-700 space-y-1">
              <li>• {anomaly.riskReasons || "See above."}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg md:rounded-xl text-xs md:text-sm"
          >
            This was me
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1 bg-red-600 hover:bg-red-700 rounded-lg md:rounded-xl text-xs md:text-sm"
          >
            Report Fraud
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
