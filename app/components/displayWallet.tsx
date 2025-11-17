"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

interface WalletDisplayProps {
  stxwallet: string;
}

export default function WalletDisplay({ stxwallet }: WalletDisplayProps) {
  const copyWallet = async () => {
    if (!stxwallet) {
      toast.error("No wallet to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(stxwallet);
      toast.success("STX wallet copied to clipboard");
    } catch (error) {
      console.error("Failed to copy STX wallet", error);
      toast.error("Failed to copy wallet");
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Your STX Wallet</h2>
      </div>

      <ul className="space-y-2">
        <li className="bg-gray-50 p-3 rounded-md border border-gray-200 font-mono text-blue-700 break-words">
          {stxwallet || "create new stx wallet"}
          <button
            type="button"
            className="ml-4 inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-blue-600 hover:border-blue-400 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={copyWallet}
            disabled={!stxwallet}
            aria-label="Copy wallet address"
          >
            <Copy className="h-5 w-5" />
          </button>
        </li>
      </ul>

      {/* QR Code */}
      {stxwallet && (
        <div className="mt-4 flex justify-center">
          <QRCodeSVG
            value={stxwallet}
            size={128}
            bgColor="#ffffff"
            fgColor="#1D4ED8"
          />
        </div>
      )}
    </section>
  );
}
