# Turnkey "Key Not Found" Error - Diagnosis & Solutions

## The Problem

When trying to mint NFTs (or make any contract calls), you're getting:

```
Error: Key not found for publicKey: 036f1bb1a128d9bc54645ef2afd2d19855d7d61e6038f6ca4987d1cdd6b7fde9ef
```

But your wallet's public key is:
```
025afa6566651f6c49d84a482a1af918b25ba7caac0b06d9ab8d79a45b72715aeb
```

## Root Cause

Turnkey's IndexedDB-based stamper cannot find the private key needed to sign transactions. This happens because:

1. **Wallet was created in a different browser/device**: IndexedDB is browser-specific and not synced across devices
2. **Wallet was imported but private key wasn't stored**: The public key and address exist, but the private key for signing doesn't
3. **IndexedDB was cleared**: Browser storage was cleared or the wallet data was corrupted

## Diagnosis Steps

### Step 1: Check Your Wallet Information

With the enhanced logging now in place, check your browser console for:

```javascript
🔍 Wallets changed: {
  walletCount: 1,
  wallets: [{
    walletName: "stx wallet",
    walletId: "...",
    accountCount: 1,
    accounts: [{
      publicKey: "025afa...",
      path: "m/44'/5757'/0'/0/0",
      curve: "SECP256K1"
    }]
  }]
}
```

### Step 2: Verify the Public Key

Check if the public key in the logs matches what's being used for signing. If they don't match, there's a wallet synchronization issue.

## Solutions

### Option 1: Export and Re-Import Wallet (Recommended for Production)

1. **Export your existing wallet** (if you have funds):
   - Use the "Backup Wallet" button in the UI
   - Save the exported wallet file securely

2. **Clear browser data**:
   ```javascript
   // In browser console
   indexedDB.deleteDatabase('turnkey');
   localStorage.clear();
   ```

3. **Refresh and log in again**

4. **Import the wallet back** if you exported it, or create a new one

### Option 2: Use Server-Side Signing (Hackathon/Demo Only)

**⚠️ WARNING**: This defeats the purpose of non-custodial wallets but works for demos.

Modify `/app/api/contract/mint-nft/route.ts` to handle client requests:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { signContractCallWithTurnkey } from "@/app/lib/stacks-utils";
import { principalCV } from "@stacks/transactions";
import { CONTRACTS } from "@/app/lib/contracts";

export async function POST(request: NextRequest) {
  try {
    const { recipientAddress } = await request.json();

    if (!recipientAddress) {
      return NextResponse.json(
        { error: "recipientAddress is required" },
        { status: 400 }
      );
    }

    // Server wallet signs for user (hackathon workaround)
    const transaction = await signContractCallWithTurnkey({
      contractAddress: CONTRACTS.BTCUNI_NFT,
      contractName: "btc-university-nft",
      functionName: "mint-for-student",
      functionArgs: [principalCV(recipientAddress)],
    });

    const txId = await broadcastContractCall(transaction);

    return NextResponse.json({
      success: true,
      txId,
      message: "Successfully minted NFT certificate",
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("NFT minting failed:", error);
    return NextResponse.json(
      { error: error.message || "NFT minting failed" },
      { status: 500 }
    );
  }
}
```

Then update `admin-panel.tsx` to use the API route instead:

```typescript
const handleMintNft = async () => {
  try {
    if (!nftMintAddress.trim()) {
      throw new Error("Student address is required");
    }

    const response = await fetch("/api/contract/mint-nft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientAddress: nftMintAddress.trim() }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to mint NFT");
    }

    showSuccess(`NFT minted for student (tx ${data.txId.slice(0, 10)}…)`);
    setNftMintAddress("");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to mint NFT";
    showError(message);
  }
};
```

### Option 3: Switch to Stacks Native Wallets (Best for Production)

Use Leather or Xverse wallets with `@stacks/connect`:

```bash
npm install @stacks/connect
```

```typescript
import { openContractCall } from "@stacks/connect";
import { principalCV } from "@stacks/transactions";
import { StacksTestnet } from "@stacks/network";

const handleMintNft = async () => {
  const nftContract = parseContractId(CONTRACTS.BTCUNI_NFT);
  
  await openContractCall({
    network: new StacksTestnet(),
    contractAddress: nftContract.address,
    contractName: nftContract.name,
    functionName: "mint-for-student",
    functionArgs: [principalCV(nftMintAddress.trim())],
    onFinish: (data) => {
      showSuccess(`NFT minted! tx ${data.txId.slice(0, 10)}…`);
      setNftMintAddress("");
    },
    onCancel: () => {
      showError("Transaction cancelled");
    },
  });
};
```

## Recommended Approach

### For Hackathon/Demo:
- Use **Option 2** (server-side signing) with clear documentation that this is temporary
- Document it as a known limitation

### For Production:
- Use **Option 3** (Stacks native wallets) for true non-custodial control
- Or wait for Turnkey to add full Stacks support and use **Option 1**

## Why This Happens with Turnkey

Turnkey's React Wallet Kit uses IndexedDB to store private keys locally (for security). The `IndexedDbStamper` looks up keys by public key when signing. If:

1. The wallet was created elsewhere, the private key isn't in this browser's IndexedDB
2. The IndexedDB was cleared, the private key is gone
3. There's a wallet/account mismatch, it's looking for the wrong key

The error message now provides helpful context:

```
Turnkey cannot find the private key for public key: 025afa...

This usually means:
1. The wallet was created in a different browser/device
2. The wallet's private key is not in IndexedDB
3. You may need to export and re-import your wallet
```

## Next Steps

1. Check the console logs to see which wallets and accounts are available
2. Verify you're using the correct wallet in the correct browser
3. Choose one of the solutions above based on your use case (demo vs production)
4. If this is for the hackathon, use Option 2 (server-side) with documentation
5. If this is for production, use Option 3 (Stacks native wallets)

## Testing the Fix

After implementing a solution, test by:

1. Refresh the page and log in
2. Navigate to the admin panel
3. Try minting an NFT
4. Check console logs for the enhanced debugging output
5. Verify the transaction appears on the Stacks testnet explorer

