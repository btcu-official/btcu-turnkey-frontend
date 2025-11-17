# Turnkey React Wallet Kit - Stacks Contract Signing Issue

## Problem

The Turnkey React Wallet Kit (`@turnkey/react-wallet-kit`) **does not currently support raw payload signing** for custom blockchain transactions like Stacks contract calls in the same way the server SDK does.

### What We Tried

1. **Using `httpClient.signRawPayload()`** - This fails because the `httpClient` from `useTurnkey()` is designed for iframe-based wallet operations, not direct signing API calls
2. **Error received**: `Turnkey error 8: Resource exhausted: Signing is disabled because your organization is over its allotted quota`
   - This happens even though you have 0/25 signatures used
   - The SDK is hitting the wrong endpoint or using wrong authentication

## Root Cause

React Wallet Kit's embedded wallets are designed for:

- ETH/EVM chains (via ethers/viem providers)
- Solana (via Solana wallet adapter)
- Standard wallet operations (sign message, send transaction)

**They don't expose** `signRawPayload` for custom blockchain transactions.

## Solutions

### Option 1: Use Server-Side Signing (NOT RECOMMENDED)

Keep the backend routes but this defeats the purpose of non-custodial embedded wallets.

### Option 2: Contact Turnkey for Stacks Support

Reach out to Turnkey (help@turnkey.com) and request:

- Stacks network support in React Wallet Kit
- `signRawPayload` exposure in the browser SDK for custom chains
- Or a Stacks-specific signing method

### Option 3: Hybrid Approach (RECOMMENDED FOR HACKATHON)

1. **Keep read-only functions** client-side (no signing needed)
2. **Use server-side signing** temporarily for the hackathon with API keys
3. **Document** that this is a temporary approach until Turnkey adds full Stacks support

### Option 4: Switch to Different Wallet

Use a Stacks-native wallet like:

- **Leather Wallet** (formerly Hiro Wallet)
- **Xverse**
- Use `@stacks/connect` for wallet integration

## Current Implementation Status

### ✅ Working

- Wallet creation with Turnkey
- Address derivation for Stacks
- Read-only contract calls (checking whitelist status)
- UI components for courses and NFT

### ❌ Not Working

- Client-side contract call signing
- Transaction broadcasting from frontend

### 🔧 Temporary Workaround

The backend API routes (`/api/contract/*`) can work but require:

1. Proper Turnkey API keys in `.env.local`
2. **WARNING**: This means the server controls signing, not the user

## Recommendation for Hackathon

**Use the server-side approach** for the demo:

1. Set up Turnkey API keys properly
2. The backend signs transactions on behalf of users
3. **Clearly document** this is temporary for the hackathon
4. **Post-hackathon**: Work with Turnkey to add proper Stacks support or switch to Stacks-native wallets

## Alternative: Use Stacks Native Wallets

If you want truly non-custodial wallets NOW, switch to:

```typescript
import { AppConfig, showConnect, UserSession } from "@stacks/connect";
import { StacksTestnet } from "@stacks/network";
import { openContractCall } from "@stacks/connect";

// This gives users full control via browser extension wallets
const handleContractCall = async () => {
  await openContractCall({
    network: new StacksTestnet(),
    contractAddress: "ST39YX57WQXM1CCHA2RD177N4RA5FEQJKM3F22317",
    contractName: "btc-university",
    functionName: "enroll-whitelist",
    functionArgs: [],
    onFinish: (data) => {
      console.log("Transaction ID:", data.txId);
    },
  });
};
```

This works immediately with Leather/Xverse wallets.
