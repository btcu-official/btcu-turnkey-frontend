"use client";

import React, { useState, MouseEvent } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

export default function CreateWallet() {
  const { createWallet, refreshWallets } = useAuth();
  const [creating, setCreating] = useState(false);

  const handleCreateWallet = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createWallet({
        walletName: "stx wallet",
        accounts: [
          {
            curve: "CURVE_SECP256K1",
            pathFormat: "PATH_FORMAT_BIP32",
            path: `m/44'/5757'/0'/0/0`,
            addressFormat: "ADDRESS_FORMAT_COMPRESSED",
          },
        ],
      });
      await refreshWallets();
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border border-blue-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl">
          🔐
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your STX Wallet
          </h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            You need a Stacks wallet to interact with courses, earn
            certificates, and track progress on-chain. <br />
            It's secure, non-custodial, and only takes seconds to set up.
          </p>
          <button
            onClick={handleCreateWallet}
            disabled={creating}
            className="px-8 py-3 rounded-xl text-white font-semibold shadow-md transition-all duration-200 bg-blue-600 hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating Wallet..." : "Create Wallet"}
          </button>
        </div>
      </div>
    </section>
  );
}
