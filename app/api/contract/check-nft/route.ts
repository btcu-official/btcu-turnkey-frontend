import { NextRequest, NextResponse } from "next/server";
import { fetchCallReadOnlyFunction, cvToValue, Cl } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { parseContractId } from "@/app/lib/contracts";

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BTCUNI_CONTRACT_ADDRESS || "STE8EXW8APGP8Y9WT9K102KCGEKZY4KH0VKSXD9Y";
const NFT_CONTRACT_NAME = "btc-university-nft";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const cv = await fetchCallReadOnlyFunction({
      contractAddress: NFT_CONTRACT_ADDRESS,
      contractName: NFT_CONTRACT_NAME,
      functionName: "has-nft",
      functionArgs: [Cl.principal(address)],
      senderAddress: address,
      network: STACKS_TESTNET,
    });

    const result = cvToValue(cv) as any;
    const hasNft = result?.value === true;

    let tokenInfo = null;
    if (hasNft) {
      const tokenCv = await fetchCallReadOnlyFunction({
        contractAddress: NFT_CONTRACT_ADDRESS,
        contractName: NFT_CONTRACT_NAME,
        functionName: "get-student-token-id",
        functionArgs: [Cl.principal(address)],
        senderAddress: address,
        network: STACKS_TESTNET,
      });

      const tokenResult = cvToValue(tokenCv) as any;
      if (tokenResult?.value) {
        tokenInfo = {
          tokenId: Number(tokenResult.value["token-id"] || tokenResult.value.tokenId || 0),
          minted: tokenResult.value.minted === true,
        };
      }
    }

    return NextResponse.json({
      success: true,
      hasNft,
      tokenInfo,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("NFT check failed:", error);
    return NextResponse.json(
      { error: error.message || "NFT check failed" },
      { status: 500 }
    );
  }
}

