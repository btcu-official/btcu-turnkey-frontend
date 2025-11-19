"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Sparkles, ExternalLink } from "lucide-react";

interface NFTDisplayProps {
  studentAddress: string;
}

export default function StudentNFTDisplay({ studentAddress }: NFTDisplayProps) {
  const [hasNft, setHasNft] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ tokenId: number; minted: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentAddress) {
      setLoading(false);
      return;
    }

    const checkNFT = async () => {
      try {
        const res = await fetch("/api/contract/check-nft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: studentAddress }),
        });

        const data = await res.json();
        if (data.success) {
          setHasNft(data.hasNft);
          setTokenInfo(data.tokenInfo);
        }
      } catch (err) {
        console.error("Error checking NFT:", err);
      } finally {
        setLoading(false);
      }
    };

    checkNFT();
  }, [studentAddress]);

  // Don't display anything if loading or no NFT
  if (loading || !hasNft) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 rounded-2xl border-2 border-orange-300 p-6 shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <Award className="w-12 h-12 text-orange-500" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </motion.div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-2xl font-bold text-gray-900">
              🎓 Certificate Earned!
            </h3>
          </div>
          <p className="text-gray-700 mb-3">
            Congratulations! You've completed your Bitcoin education and earned an
            on-chain completion certificate.
          </p>

          <div className="bg-white rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Certificate NFT</span>
              <span className="font-semibold text-orange-600">Token #{tokenInfo?.tokenId}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span className="font-semibold text-green-600 flex items-center gap-1">
                ✓ Minted
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Blockchain</span>
              <span className="font-mono text-gray-800 text-xs">Stacks (Bitcoin L2)</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div className="bg-white/50 rounded-lg p-3 text-center">
              <div className="text-gray-600 mb-1">📜</div>
              <div className="font-semibold text-gray-900">On-Chain Proof</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3 text-center">
              <div className="text-gray-600 mb-1">🔒</div>
              <div className="font-semibold text-gray-900">Tamper-Proof</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3 text-center">
              <div className="text-gray-600 mb-1">💎</div>
              <div className="font-semibold text-gray-900">Yours Forever</div>
            </div>
          </div>

          <button
            onClick={() => window.open(`https://explorer.hiro.so/address/${studentAddress}?chain=testnet`, "_blank")}
            className="mt-4 w-full sm:w-auto px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            View on Explorer
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

