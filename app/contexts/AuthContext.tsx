"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { publicKeyToAddress } from "@stacks/transactions";

interface AuthContextType {
  // Turnkey state
  isAuthenticated: boolean;
  isLoading: boolean;

  // Wallet information
  stxAddress: string | null;
  stxPubKey: string | null;
  wallets: any[];
  httpClient: any;

  // Turnkey functions
  handleLogin: () => void;
  logout: () => void;
  refreshWallets: () => void;
  createWallet: (config: any) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const turnkey = useTurnkey();
  const {
    authState,
    wallets,
    httpClient,
    handleLogin,
    logout,
    refreshWallets,
    createWallet,
  } = turnkey;

  const [stxAddress, setStxAddress] = useState<string | null>(null);
  const [stxPubKey, setStxPubKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derive STX address and public key from wallets
  useEffect(() => {
    const account = wallets?.[0]?.accounts?.[0];
    const pubKey = account?.publicKey;

    if (pubKey) {
      setStxPubKey(pubKey);
      try {
        const address = publicKeyToAddress(pubKey, "testnet");
        setStxAddress(address);
      } catch (err) {
        console.error("Failed to derive STX address:", err);
        setStxAddress(null);
      }
    } else {
      setStxAddress(null);
      setStxPubKey(null);
    }
  }, [wallets]);

  // Update loading state
  useEffect(() => {
    if (authState === "authenticated" || authState === "unauthenticated") {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [authState]);

  const value: AuthContextType = {
    isAuthenticated: authState === "authenticated",
    isLoading,
    stxAddress,
    stxPubKey,
    wallets: wallets || [],
    httpClient: httpClient || null,
    handleLogin,
    logout,
    refreshWallets,
    createWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
