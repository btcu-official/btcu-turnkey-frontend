"use client";

import { useEffect, useState } from "react";
import AdminPanel from "@/app/components/admin-panel";
import Header from "@/app/components/header";
import {
  CONTRACT_OWNER_ADDRESS,
  CONTRACTS,
  checkIsInstructor,
} from "@/app/lib/stacks-client-utils";
import { ShieldAlert, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";

export default function AdminPage() {
  const { isAuthenticated, isLoading, stxAddress, stxPubKey, httpClient } =
    useAuth();
  const [isInstructor, setIsInstructor] = useState(false);
  const [checkingInstructor, setCheckingInstructor] = useState(true);

  // Check if current user is an instructor
  useEffect(() => {
    async function checkInstructorStatus() {
      if (!stxAddress) {
        setIsInstructor(false);
        setCheckingInstructor(false);
        return;
      }

      try {
        setCheckingInstructor(true);
        const result = await checkIsInstructor(stxAddress, CONTRACTS.BTCUNI_MAIN);
        setIsInstructor(result);
      } catch (err) {
        console.error("Failed to check instructor status:", err);
        setIsInstructor(false);
      } finally {
        setCheckingInstructor(false);
      }
    }

    checkInstructorStatus();
  }, [stxAddress]);

  // Loading state - show header while loading
  if (isLoading || checkingInstructor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <Header />
        </div>

        <div className="flex items-center justify-center p-6 mt-20">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-600 font-medium">
              Verifying admin access...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not instructor - show unauthorized message
  if (!isInstructor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <Header />
        </div>

        <div className="flex items-center justify-center p-6 mt-20">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">
              This page is restricted to authorized instructors only.
            </p>
            {stxAddress ? (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Your Address:</p>
                  <p className="font-mono text-gray-800 break-all">
                    {stxAddress}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Status:</p>
                  <p className="text-gray-800">Not an authorized instructor</p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-500 text-xs">
                    Contact the contract owner ({CONTRACT_OWNER_ADDRESS}) to request instructor access.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Please connect your wallet to continue.
              </p>
            )}
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Instructor verified - show admin panel
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <Header />
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Admin Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Instructor Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your BTC University smart contracts
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-800">
                Instructor Verified
              </span>
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        <AdminPanel
          stxAddress={stxAddress || ""}
          stxPubKey={stxPubKey || ""}
          httpClient={httpClient}
          isInstructor={isInstructor}
        />
      </div>
    </div>
  );
}
