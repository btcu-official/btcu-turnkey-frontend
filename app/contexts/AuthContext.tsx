"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const previousAuthState = useRef<string | null>(null);

  // Derive STX address and public key from wallets
  useEffect(() => {
    console.log("🔍 Wallets changed:", {
      walletCount: wallets?.length,
      wallets: wallets?.map((w, i) => ({
        index: i,
        walletName: w.walletName,
        walletId: w.walletId,
        accountCount: w.accounts?.length,
        accounts: w.accounts?.map((a, j) => ({
          index: j,
          publicKey: a.publicKey?.substring(0, 20) + "...",
          path: a.path,
          curve: a.curve,
        })),
      })),
    });

    const account = wallets?.[0]?.accounts?.[0];
    const pubKey = account?.publicKey;

    if (pubKey) {
      console.log("✅ Using account:", {
        publicKey: pubKey,
        path: account.path,
        curve: account.curve,
      });
      setStxPubKey(pubKey);
      try {
        const address = publicKeyToAddress(pubKey, "testnet");
        setStxAddress(address);
        console.log("✅ Derived STX address:", address);
      } catch (err) {
        console.error("Failed to derive STX address:", err);
        setStxAddress(null);
      }
    } else {
      console.log("⚠️ No wallet or account found");
      setStxAddress(null);
      setStxPubKey(null);
    }
  }, [wallets]);

  // Update loading state and handle auth state changes
  useEffect(() => {
    // Detect auth state changes
    if (previousAuthState.current !== authState) {
      console.log(`🔐 Auth state changed: ${previousAuthState.current} → ${authState}`);
      
      // If we transition from authenticated to unauthenticated (expired session)
      // Clear wallet data to prevent stale state
      if (previousAuthState.current === "authenticated" && authState === "unauthenticated") {
        console.log("⚠️ Session expired - clearing wallet data");
        setStxAddress(null);
        setStxPubKey(null);
      }
      
      previousAuthState.current = authState;
    }

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
