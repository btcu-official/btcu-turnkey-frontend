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

// Fetch account nonce from Hiro API
export async function fetchAccountNonce(address: string): Promise<bigint> {
  try {
    const res = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${address}/nonces`
    );
    if (!res.ok) throw new Error("Failed to fetch nonce");
    const data = await res.json();
    return BigInt(data.possible_next_nonce || 0);
  } catch (err) {
    console.error("Error fetching nonce:", err);
    return 0n;
  }
}

// Construct unsigned contract call
async function constructContractCall(
  params: ContractCallParams
): Promise<{ transaction: StacksTransactionWire; signer: TransactionSigner }> {
  const [contractAddr, contractName] = params.contractAddress.split(".");

  const nonce = params.nonce ?? (await fetchAccountNonce(params.senderAddress));
  const fee = params.fee ?? 10000n;

  const transaction = await makeUnsignedContractCall({
    contractAddress: contractAddr,
    contractName: contractName,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    publicKey: params.senderPubKey,
    postConditionMode: PostConditionMode.Allow,
    fee,
    nonce,
    network: STACKS_NETWORK,
  });

  const signer = new TransactionSigner(transaction);
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
  console.log("🔧 Building unsigned transaction...");
  console.log("  Contract:", params.contractAddress);
  console.log("  Function:", params.functionName);
  console.log("  Sender:", params.senderAddress);
  console.log("  PubKey:", params.senderPubKey);

  const { transaction, signer } = await constructContractCall(params);
  const preSignSigHash = generatePreSignSigHash(transaction, signer);

  const payload = `0x${preSignSigHash}`;
  console.log("📝 Payload to sign:", payload);

  // Sign using Turnkey client from useTurnkey hook
  console.log("✍️  Calling signRawPayload...");
  const signResult = await turnkeyClient.signRawPayload({
    signWith: params.senderPubKey,
    payload,
    encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
    hashFunction: "HASH_FUNCTION_NO_OP",
  });

  console.log("✅ Signature received:", {
    v: signResult.v,
    r: signResult.r.substring(0, 10) + "...",
    s: signResult.s.substring(0, 10) + "...",
  });

  // Construct RSV signature
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
}
