import { Turnkey as TurnkeyServerSDK } from "@turnkey/sdk-server";
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
export { CONTRACTS, CONTRACT_OWNER_ADDRESS } from "./contracts";

// Stacks network configuration from environment
export const STACKS_NETWORK =
  (process.env.NEXT_PUBLIC_STACKS_NETWORK as "testnet" | "mainnet") ||
  "testnet";

interface ContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
  senderPubKey: string;
  nonce?: bigint;
  fee?: bigint;
  postConditions?: any[];
}

// Initialize Turnkey client
export function getTurnkeyClient() {
  return new TurnkeyServerSDK({
    apiBaseUrl: process.env.TURNKEY_BASE_URL!,
    apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
    defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
  });
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

// Construct unsigned contract call transaction
export async function constructContractCall(
  params: ContractCallParams
): Promise<{ transaction: StacksTransactionWire; signer: TransactionSigner }> {
  const [contractAddr, contractName] = params.contractAddress.split(".");

  // Fetch nonce if not provided
  const nonce = params.nonce ?? (await fetchAccountNonce(params.senderAddress));
  const fee = params.fee ?? 10000n; // Default fee: 0.01 STX

  const transaction = await makeUnsignedContractCall({
    contractAddress: contractAddr,
    contractName: contractName,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    publicKey: params.senderPubKey,
    postConditionMode: PostConditionMode.Allow, // Allow for testing
    // anchorMode: AnchorMode.Any,
    fee,
    nonce,
    network: STACKS_NETWORK,
    postConditions: params.postConditions || [],
  });

  const signer = new TransactionSigner(transaction);
  return { transaction, signer };
}

// Generate pre-sign hash for Turnkey signing
export function generatePreSignSigHash(
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

// Sign contract call transaction with Turnkey (using server wallet)
export async function signContractCallWithTurnkey(
  params: Omit<ContractCallParams, "senderPubKey" | "senderAddress">
): Promise<StacksTransactionWire> {
  const client = getTurnkeyClient();

  // Use server wallet keys from environment
  const serverPubKey = process.env.TURNKEY_SIGNER_PUBLIC_KEY!;
  const serverAddress = process.env.TURNKEY_SIGNER_ADDRESS!;

  if (!serverPubKey || !serverAddress) {
    throw new Error(
      "Server wallet not configured. Set TURNKEY_SIGNER_PUBLIC_KEY and TURNKEY_SIGNER_ADDRESS in .env.local"
    );
  }

  const { transaction, signer } = await constructContractCall({
    ...params,
    senderPubKey: serverPubKey,
    senderAddress: serverAddress,
  });

  const preSignSigHash = generatePreSignSigHash(transaction, signer);

  const payload = `0x${preSignSigHash}`;

  // Sign with server wallet key (like the example)
  const signature = await client.apiClient().signRawPayload({
    payload,
    signWith: serverPubKey,
    encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
    hashFunction: "HASH_FUNCTION_NO_OP",
  });

  // Construct RSV signature (recovery byte + r + s)
  const nextSig = `${signature.v}${signature.r.padStart(
    64,
    "0"
  )}${signature.s.padStart(64, "0")}`;
  const spendingCondition = transaction.auth
    .spendingCondition as SingleSigSpendingCondition;
  spendingCondition.signature = createMessageSignature(nextSig);

  return transaction;
}

// Broadcast transaction to Stacks network
export async function broadcastContractCall(
  transaction: StacksTransactionWire
): Promise<string> {
  const result = await broadcastTransaction({
    transaction,
    network: STACKS_NETWORK,
  });

  if (typeof result === "string") {
    return result; // Transaction ID
  }

  throw new Error(`Transaction failed: ${JSON.stringify(result)}`);
}
