"use client";

import {
  TurnkeyProvider,
  TurnkeyProviderConfig,
} from "@turnkey/react-wallet-kit";
import "@turnkey/react-wallet-kit/styles.css";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const turnkeyConfig: TurnkeyProviderConfig = {
  organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
  authProxyConfigId: process.env.NEXT_PUBLIC_AUTH_PROXY_CONFIG_ID!,
};

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasCleared = useRef(false);

  useEffect(() => {
    // Clear Turnkey auth state on initial mount (page refresh)
    // This prevents stale/expired sessions from breaking the app
    if (!hasCleared.current) {
      hasCleared.current = true;
      
      // Clear Turnkey-related localStorage/sessionStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('turnkey') || key?.includes('tk_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Also clear sessionStorage
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.includes('turnkey') || key?.includes('tk_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log('🔄 Cleared persisted Turnkey auth state on page load');
    }
  }, []);

  return (
    <TurnkeyProvider
      config={turnkeyConfig}
      callbacks={{
        onAuthenticationSuccess: () => {
          router.push("/dashboard");
        },
      }}
    >
      <AuthProvider>
        <Toaster position="top-right" />
        {children}
      </AuthProvider>
    </TurnkeyProvider>
  );
}
