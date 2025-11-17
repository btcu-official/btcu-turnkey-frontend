import { NextRequest, NextResponse } from "next/server";
import { uintCV } from "@stacks/transactions";
import {
  signContractCallWithTurnkey,
  broadcastContractCall,
  CONTRACTS,
} from "@/app/lib/stacks-utils";
import { getSbtcContractPrincipalCV } from "@/app/lib/contract-helpers";

export async function POST(req: NextRequest) {
  try {
    const { courseId } = await req.json();

    if (courseId === undefined) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Server wallet signs for all users (hackathon workaround)
    const transaction = await signContractCallWithTurnkey({
      contractAddress: CONTRACTS.BTCUNI_MAIN,
      contractName: "btc-university",
      functionName: "enroll-course",
      functionArgs: [uintCV(courseId), getSbtcContractPrincipalCV()],
    });

    const txId = await broadcastContractCall(transaction);

    return NextResponse.json({
      success: true,
      txId,
      message: `Successfully enrolled in course ${courseId}`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Course enrollment failed:", error);
    return NextResponse.json(
      { error: error.message || "Course enrollment failed" },
      { status: 500 }
    );
  }
}
