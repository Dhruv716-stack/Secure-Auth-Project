"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// ✅ Dynamically import the map client component (no SSR)
const MapLeafletClient = dynamic(() => import("@/components/dashboard/MapLeafletClient"), {
  ssr: false,
  loading: () => <div className="text-gray-400 text-center">Loading map...</div>
});

export function MapVisualization() {
  // 🧠 Generate a unique key only once — helps force fresh map instance
  const mapKey = useMemo(
    () => Date.now().toString(36) + Math.random().toString(36).substring(2),
    []
  );

  return <MapLeafletClient key={mapKey} />;
}
