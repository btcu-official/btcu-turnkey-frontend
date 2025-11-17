"use client";

import {
  TurnkeyProvider,
  TurnkeyProviderConfig,
} from "@turnkey/react-wallet-kit";
import "@turnkey/react-wallet-kit/styles.css";
import { useRouter } from "next/navigation";
import React from "react";
import { AuthProvider } from "@/app/contexts/AuthContext";

const turnkeyConfig: TurnkeyProviderConfig = {
  organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
  authProxyConfigId: process.env.NEXT_PUBLIC_AUTH_PROXY_CONFIG_ID!,
};

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <TurnkeyProvider
      config={turnkeyConfig}
      callbacks={{
        onAuthenticationSuccess: () => {
          router.push("/dashboard");
        },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </TurnkeyProvider>
  );
}
