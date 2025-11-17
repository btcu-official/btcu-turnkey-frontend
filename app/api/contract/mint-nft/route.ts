import { NextRequest, NextResponse } from "next/server";
import { principalCV } from "@stacks/transactions";
import {
  signContractCallWithTurnkey,
  broadcastContractCall,
  CONTRACTS,
} from "@/app/lib/stacks-utils";

export async function POST(req: NextRequest) {
  try {
    const { recipientAddress } = await req.json();

    if (!recipientAddress) {
      return NextResponse.json(
        { error: "Recipient address is required" },
        { status: 400 }
      );
    }

    // Server wallet signs for all users (hackathon workaround)
    const transaction = await signContractCallWithTurnkey({
      contractAddress: CONTRACTS.BTCUNI_NFT,
      contractName: "btcuniNft",
      functionName: "mint",
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
