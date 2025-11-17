import { NextRequest, NextResponse } from "next/server";
import { Turnkey as TurnkeyServerSDK } from "@turnkey/sdk-server";
import {
  broadcastTransaction,
  createMessageSignature,
  makeUnsignedSTXTokenTransfer,
  sigHashPreSign,
  TransactionSigner,
  type SingleSigSpendingCondition,
  type StacksTransactionWire,
  validateStacksAddress,
} from "@stacks/transactions";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const client = new TurnkeyServerSDK({
  apiBaseUrl: process.env.TURNKEY_BASE_URL!,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
});

// Construct unsigned STX transaction
const constructStacksTx = async (
  senderPubKey: string,
  recipient: string,
  amount: bigint
) => {
  const nonce = 0n;
  const fee = 180n;

  const transaction = await makeUnsignedSTXTokenTransfer({
    recipient,
    amount,
    publicKey: senderPubKey,
    nonce,
    fee,
    network: "mainnet", // match network with broadcast
  });

  const signer = new TransactionSigner(transaction);
  return { stacksTransaction: transaction, stacksTxSigner: signer };
};

// Generate pre-sign hash
const generatePreSignSigHash = (
  transaction: StacksTransactionWire,
  signer: TransactionSigner
) => {
  return sigHashPreSign(
    signer.sigHash,
    transaction.auth.authType,
    transaction.auth.spendingCondition.fee,
    transaction.auth.spendingCondition.nonce
  );
};

// Sign STX transaction using Turnkey
const signStacksTx = async (
  senderPubKey: string,
  recipient: string,
  amount: bigint
) => {
  const { stacksTransaction, stacksTxSigner } = await constructStacksTx(
    senderPubKey,
    recipient,
    amount
  );
  const preSignSigHash = generatePreSignSigHash(
    stacksTransaction,
    stacksTxSigner
  );

  const payload = `0x${preSignSigHash}`;
  const signature = await client.apiClient().signRawPayload({
    payload,
    signWith: senderPubKey,
    encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
    hashFunction: "HASH_FUNCTION_NO_OP",
  });

  const nextSig = `${signature.v}${signature.r.padStart(
    64,
    "0"
  )}${signature.s.padStart(64, "0")}`;
  const spendingCondition = stacksTransaction.auth
    .spendingCondition as SingleSigSpendingCondition;
  spendingCondition.signature = createMessageSignature(nextSig);

  return stacksTransaction;
};

// API handler
export async function POST(req: NextRequest) {
  try {
    const { recipient, amount, pubKey } = await req.json();

    if (!recipient || !amount || !pubKey) {
      return NextResponse.json(
        { error: "Recipient, amount, and stxPubKey are required" },
        { status: 400 }
      );
    }

    if (!validateStacksAddress(recipient)) {
      return NextResponse.json(
        { error: "Invalid recipient STX address" },
        { status: 400 }
      );
    }

    const amountMicro = BigInt(Math.floor(Number(amount) * 1_000_000));

    // Sign with Turnkey public key (from stxwallet)
    const tx = await signStacksTx(pubKey, recipient, amountMicro);

    const result = await broadcastTransaction({
      transaction: tx,
      network: "mainnet",
    });

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Transaction failed:", error);
    return NextResponse.json(
      { error: error.message || "Transaction failed" },
      { status: 500 }
    );
  }
}
