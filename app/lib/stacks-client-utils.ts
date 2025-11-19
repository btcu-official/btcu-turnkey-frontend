"use client";

import {
  broadcastTransaction,
  createMessageSignature,
  makeUnsignedContractCall,
  PostConditionMode,
  sigHashPreSign,
  TransactionSigner,
  type ClarityValue,
  type SingleSigSpendingCondition,
  type StacksTransactionWire,
} from "@stacks/transactions";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";
import type { TurnkeySDKClientBase } from "@turnkey/core";
export { CONTRACTS, CONTRACT_OWNER_ADDRESS } from "./contracts";

const NETWORK_ENV =
  (process.env.NEXT_PUBLIC_STACKS_NETWORK as "testnet" | "mainnet") ||
  "testnet";

export const STACKS_NETWORK =
  NETWORK_ENV === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;

interface ContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
  senderPubKey: string;
  nonce?: bigint;
  fee?: bigint;
}

// Fetch account nonce from Hiro API with timeout
export async function fetchAccountNonce(address: string): Promise<bigint> {
  console.log("🔄 Fetching nonce for:", address);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const res = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${address}/nonces`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.error(`❌ Nonce fetch failed: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to fetch nonce: ${res.status}`);
    }
    
    const data = await res.json();
    const nonce = BigInt(data.possible_next_nonce || 0);
    console.log("✅ Nonce fetched:", nonce.toString());
    return nonce;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error("❌ Nonce fetch timeout after 10s");
      throw new Error("Nonce fetch timeout - network may be slow or unavailable");
    }
    console.error("❌ Error fetching nonce:", err);
    throw err; // Re-throw instead of returning 0n to make failures explicit
  }
}

// Check if address is an instructor using the smart contract
export async function checkIsInstructor(
  address: string,
  contractAddress: string
): Promise<boolean> {
  try {
    const { fetchCallReadOnlyFunction, cvToValue, principalCV } = await import(
      "@stacks/transactions"
    );
    const { parseContractId } = await import("./contracts");

    const { address: contractAddr, name: contractName } =
      parseContractId(contractAddress);

    const cv = await fetchCallReadOnlyFunction({
      contractAddress: contractAddr,
      contractName,
      functionName: "is-instructor",
      functionArgs: [principalCV(address)],
      senderAddress: address,
      network: STACKS_NETWORK,
    });

    const result = cvToValue(cv);
    return Boolean(result);
  } catch (err) {
    console.error("Failed to check instructor status:", err);
    return false;
  }
}

// Construct unsigned contract call
async function constructContractCall(
  params: ContractCallParams
): Promise<{ transaction: StacksTransactionWire; signer: TransactionSigner }> {
  console.log("📦 Constructing contract call...");
  console.log("  Contract Address:", params.contractAddress);
  console.log("  Contract Name:", params.contractName);

  const nonce = params.nonce ?? (await fetchAccountNonce(params.senderAddress));
  const fee = params.fee ?? 10000n;
  console.log("  Nonce:", nonce.toString(), "Fee:", fee.toString());

  console.log("  Creating unsigned transaction...");
  const transaction = await makeUnsignedContractCall({
    contractAddress: params.contractAddress,
    contractName: params.contractName,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    publicKey: params.senderPubKey,
    postConditionMode: PostConditionMode.Allow,
    fee,
    nonce,
    network: STACKS_NETWORK,
  });
  console.log("  ✅ Transaction created");

  const signer = new TransactionSigner(transaction);
  console.log("  ✅ Signer initialized");
  
  return { transaction, signer };
}

// Generate pre-sign hash
function generatePreSignSigHash(
  transaction: StacksTransactionWire,
  signer: TransactionSigner
): string {
  return sigHashPreSign(
    signer.sigHash,
    transaction.auth.authType,
    transaction.auth.spendingCondition.fee,
    transaction.auth.spendingCondition.nonce
  );
}

// Sign contract call with Turnkey HTTP client (from useTurnkey hook)
export async function signAndBroadcastContractCall(
  params: ContractCallParams,
  turnkeyClient: TurnkeySDKClientBase
): Promise<string> {
  try {
    console.log("🔧 Building unsigned transaction...");
    console.log("  Contract Address:", params.contractAddress);
    console.log("  Contract Name:", params.contractName);
    console.log("  Function:", params.functionName);
    console.log("  Sender:", params.senderAddress);
    console.log("  PubKey:", params.senderPubKey);
    console.log("  Args:", params.functionArgs.map(arg => arg.toString()));

    const { transaction, signer } = await constructContractCall(params);
    
    console.log("🔐 Generating pre-sign hash...");
    const preSignSigHash = generatePreSignSigHash(transaction, signer);
    const payload = `0x${preSignSigHash}`;
    console.log("📝 Payload to sign:", payload);

    // Sign using Turnkey client from useTurnkey hook
    console.log("✍️  Calling signRawPayload...");
    console.log("  Signing with pubKey:", params.senderPubKey);
    
    let signResult;
    try {
      signResult = await turnkeyClient.signRawPayload({
        signWith: params.senderPubKey,
        payload,
        encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
        hashFunction: "HASH_FUNCTION_NO_OP",
      });
    } catch (signError) {
      console.error("❌ Signing failed:", signError);
      if (signError instanceof Error && signError.message.includes("Key not found")) {
        throw new Error(
          `Turnkey cannot find the private key for public key: ${params.senderPubKey.substring(0, 20)}...\n\n` +
          `This usually means:\n` +
          `1. The wallet was created in a different browser/device\n` +
          `2. The wallet's private key is not in IndexedDB\n` +
          `3. You may need to export and re-import your wallet\n\n` +
          `Original error: ${signError.message}`
        );
      }
      throw signError;
    }

    console.log("✅ Signature received:", {
      v: signResult.v,
      r: signResult.r.substring(0, 10) + "...",
      s: signResult.s.substring(0, 10) + "...",
    });

    // Construct RSV signature
    console.log("🔨 Constructing RSV signature...");
    const nextSig = `${signResult.v}${signResult.r.padStart(
      64,
      "0"
    )}${signResult.s.padStart(64, "0")}`;
    const spendingCondition = transaction.auth
      .spendingCondition as SingleSigSpendingCondition;
    spendingCondition.signature = createMessageSignature(nextSig);

    console.log("📡 Broadcasting transaction...");
    // Broadcast transaction
    const result = await broadcastTransaction({
      transaction,
      network: STACKS_NETWORK,
    });

    // Handle both string and object responses
    let txid: string;

    if (typeof result === "string") {
      txid = result;
    } else if (result && typeof result === "object" && "txid" in result) {
      txid = (result as any).txid;
    } else {
      console.error("❌ Unexpected broadcast response:", result);
      throw new Error(`Unexpected broadcast response: ${JSON.stringify(result)}`);
    }

    console.log("🎉 Transaction broadcast successful:", txid);
    console.log(
      "🔗 View on explorer:",
      `https://explorer.hiro.so/txid/${txid}?chain=${STACKS_NETWORK}`
    );

    return txid;
  } catch (error) {
    console.error("❌ Transaction failed:", error);
    if (error instanceof Error) {
      console.error("  Error name:", error.name);
      console.error("  Error message:", error.message);
      console.error("  Error stack:", error.stack);
    }
    throw error;
  }
}
