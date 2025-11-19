"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { principalCV } from "@stacks/transactions";
import { Award, Sparkles } from "lucide-react";
import {
  signAndBroadcastContractCall,
  CONTRACTS,
} from "@/app/lib/stacks-client-utils";
import { parseContractId } from "@/app/lib/contracts";
import { useAuth } from "@/app/contexts/AuthContext";

export default function NFTCertificate() {
  const { stxAddress, stxPubKey, httpClient } = useAuth();
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleMintCertificate = async () => {
    if (!stxPubKey || !stxAddress || !httpClient) {
      setToast({ type: "error", message: "Wallet not connected" });
      return;
    }

    setMinting(true);
    try {
      console.log("Minting NFT with client-side signing...");
      
      const { address: contractAddress, name: contractName } = parseContractId(
        CONTRACTS.BTCUNI_NFT
      );

      const txId = await signAndBroadcastContractCall(
        {
          contractAddress,
          contractName,
          functionName: "mint",
          functionArgs: [principalCV(stxAddress)],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient
      );

      setToast({
        type: "success",
        message: `Certificate minted! Transaction: ${txId}`,
      });
      setMinted(true);
    } catch (err) {
      console.error("NFT minting error:", err);
      const message = err instanceof Error ? err.message : "Minting failed";
      setToast({ type: "error", message });
    } finally {
      setMinting(false);
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <section className="bg-gradient-to-b from-orange-50 via-white to-yellow-50 py-16 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-semibold max-w-md ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.message}
          </motion.div>
        )}

        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
          Mint Your Certificate
        </h2>
        <p className="text-gray-700 text-lg md:text-xl">
          Complete your learning journey with an on-chain NFT certificate
        </p>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`relative bg-white rounded-3xl border-2 p-12 shadow-2xl max-w-2xl mx-auto ${
            minted ? "border-green-300 bg-green-50" : "border-orange-300"
          }`}
        >
          <div className="absolute -top-6 -right-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 text-yellow-500" />
            </motion.div>
          </div>

          <div className="mb-8">
            <Award className="w-24 h-24 mx-auto text-orange-500" />
          </div>

          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            BTC University Certificate
          </h3>
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Recipient:</span>{" "}
            {stxAddress
              ? `${stxAddress.slice(0, 8)}...${stxAddress.slice(-6)}`
              : "Connect wallet"}
          </p>
          <p className="text-gray-700 mb-8">
            <span className="font-semibold">Achievement:</span> Completed
            Bitcoin Education Program
          </p>

          {minted ? (
            <div className="bg-green-100 border-2 border-green-300 rounded-xl p-6">
              <h4 className="text-2xl font-bold text-green-900 mb-2">
                🎉 Certificate Minted!
              </h4>
              <p className="text-green-800">
                Your achievement is now forever recorded on the Stacks
                blockchain
              </p>
            </div>
          ) : (
            <button
              onClick={handleMintCertificate}
              disabled={minting || !stxPubKey}
              className="px-12 py-4 bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-lg font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {minting ? "Minting..." : "Mint Certificate NFT"}
            </button>
          )}

          <div className="mt-8 text-sm text-gray-500">
            <p>Network: Stacks Testnet</p>
            <p>Contract: ST39YX57WQXM1CCHA2RD177N4RA5FEQJKM3F22317.btcuniNft</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-md">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              📜 On-Chain Proof
            </h4>
            <p className="text-gray-700 text-sm">
              Your certificate is permanently stored on the blockchain
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-md">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              🔒 Tamper-Proof
            </h4>
            <p className="text-gray-700 text-sm">
              Nobody can modify or delete your achievement
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-md">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              💎 Unique NFT
            </h4>
            <p className="text-gray-700 text-sm">
              Each certificate is a unique digital asset you own
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
