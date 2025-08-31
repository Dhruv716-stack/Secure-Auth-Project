"use client";
import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SendMoneyCard } from "@/components/dashboard/send-money-card";
import { TransactionFeed } from "@/components/dashboard/transaction-feed";
import { MapVisualization } from "@/components/dashboard/map-visualization";

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <div className="w-full min-h-0 flex flex-col items-center py-6 px-2 md:px-6">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-blue-800">Transactions</h1>
          <p className="text-gray-500 mb-4 md:mb-6">View and manage your recent transactions, send money, and see transaction locations.</p>
          <div className="flex flex-col gap-4">
            <SendMoneyCard />
            <TransactionFeed />
            <MapVisualization />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 