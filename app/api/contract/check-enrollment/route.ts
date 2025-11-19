import { NextRequest, NextResponse } from "next/server";
import {
  hexToCV,
  cvToValue,
  principalCV,
  serializeCV,
  uintCV,
  ClarityType,
} from "@stacks/transactions";

export async function POST(req: NextRequest) {
  try {
    const { address, courseId } = await req.json();

    console.log("=== ENROLLMENT CHECK ===");
    console.log("Address:", address);
    console.log("Course ID:", courseId);

    if (!address || courseId === undefined) {
      return NextResponse.json(
        { error: "Address and course ID are required" },
        { status: 400 }
      );
    }

    const contractAddress = process.env.NEXT_PUBLIC_BTCUNI_CONTRACT_ADDRESS || "STE8EXW8APGP8Y9WT9K102KCGEKZY4KH0VKSXD9Y";
    const contractName = process.env.NEXT_PUBLIC_BTCUNI_CONTRACT_NAME || "btc-university";
    const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";
    const apiUrl =
      network === "mainnet"
        ? "https://api.hiro.so"
        : "https://api.testnet.hiro.so";

    // Build the arguments (course-id and student principal)
    const courseIdArg = uintCV(courseId);
    const principalArg = principalCV(address);

    // serializeCV returns hex string directly, just add 0x prefix
    const serializedCourseId = `0x${serializeCV(courseIdArg)}`;
    const serializedPrincipal = `0x${serializeCV(principalArg)}`;

    console.log("Serialized course ID:", serializedCourseId);
    console.log("Serialized principal:", serializedPrincipal);

    // Call read-only function to check enrollment status
    const apiEndpoint = `${apiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/is-enrolled`;
    console.log("Calling API:", apiEndpoint);

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: address,
        arguments: [serializedCourseId, serializedPrincipal],
      }),
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      console.error("Hiro API error - response not ok");
      // Not enrolled if API fails
      return NextResponse.json({
        success: true,
        isEnrolled: false,
      });
    }

    const data = await response.json();
    console.log("API response data:", JSON.stringify(data, null, 2));

    // Parse the Clarity response
    const clarityValue = hexToCV(data.result);
    console.log("Clarity value type:", clarityValue.type);

    let isEnrolled = false;

    // Check if it's a ResponseOk type
    if (clarityValue.type === ClarityType.ResponseOk) {
      console.log("Response is OK (student is enrolled)");
      const parsedValue = cvToValue(clarityValue);
      console.log("Parsed value:", JSON.stringify(parsedValue, null, 2));

      // The inner value should be a boolean true if enrolled
      if (
        parsedValue &&
        typeof parsedValue === "object" &&
        "value" in parsedValue
      ) {
        isEnrolled = parsedValue.value === true;
        console.log("Enrolled status:", isEnrolled);
      }
    } else if (clarityValue.type === ClarityType.ResponseErr) {
      console.log("Response is error (not enrolled - ERR-USER-NOT-ENROLLED)");
      isEnrolled = false;
    } else {
      console.log("Unexpected response type");
    }

    console.log("Final enrollment status:", isEnrolled);
    console.log("=== END ENROLLMENT CHECK ===\n");

    return NextResponse.json({
      success: true,
      isEnrolled,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Enrollment check failed:", error);
    // Return false instead of error for better UX
    return NextResponse.json({
      success: true,
      isEnrolled: false,
    });
  }
}
