"use client";

import React from "react";

interface BalanceProps {
  stxBalance: bigint;
  sbtcBalance: bigint;
  loading: boolean;
}

export default function Balance({
  stxBalance,
  sbtcBalance,
  loading,
}: BalanceProps) {
  // Convert micro-STX to STX (6 decimals)
  const balanceInStx = Number(stxBalance) / 1_000_000;

  // Convert sBTC to display format (8 decimals)
  const balanceInSbtc = Number(sbtcBalance) / 100_000_000;

  return (
    <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Wallet Balances
      </h3>
      {loading ? (
        <p className="text-gray-600">Loading balances...</p>
      ) : (
        <div className="space-y-4">
          {/* STX Balance */}
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">STX:</span>
            <span className="text-2xl font-bold text-blue-600">
              {balanceInStx.toFixed(6)} STX
            </span>
          </div>

          {/* sBTC Balance */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="text-gray-700 font-medium">sBTC:</span>
            <span className="text-2xl font-bold text-orange-600">
              {balanceInSbtc.toFixed(8)} sBTC
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
