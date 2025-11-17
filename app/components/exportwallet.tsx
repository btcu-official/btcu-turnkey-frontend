"use client";

import React, { MouseEvent } from "react";
import { type Wallet } from "@turnkey/react-wallet-kit";
import { Download } from "lucide-react";
import { useTurnkey } from "@turnkey/react-wallet-kit";

interface ExportWalletProps {
  wallets: Wallet[];
}

export default function ExportWallet({ wallets }: ExportWalletProps) {
  // Note: handleExportWallet is not available in our AuthContext, so we use useTurnkey directly here
  const { handleExportWallet } = useTurnkey();

  const handleExport = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (wallets.length > 0) handleExportWallet(wallets[0]);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Backup Wallet
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        Export wallet for safekeeping
      </p>
      <button
        onClick={handleExport}
        className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-400 hover:shadow-lg text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
    </div>
  );
}
