"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  fetchCallReadOnlyFunction,
  cvToValue,
  Cl,
  principalCV,
  uintCV,
} from "@stacks/transactions";
import type { TurnkeySDKClientBase } from "@turnkey/core";
import {
  CONTRACTS,
  CONTRACT_OWNER_ADDRESS,
  STACKS_NETWORK,
  signAndBroadcastContractCall,
} from "@/app/lib/stacks-client-utils";
import { getContractPrincipalCV } from "@/app/lib/contract-helpers";
import { parseContractId } from "@/app/lib/contracts";
import {
  RefreshCw,
  ShieldCheck,
  Lock,
  UserPlus,
  UserMinus,
  BookPlus,
  CheckCircle2,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface AdminPanelProps {
  stxAddress: string;
  stxPubKey: string;
  httpClient: TurnkeySDKClientBase | null | undefined;
  isInstructor?: boolean;
}

const DEFAULT_COURSE = {
  courseId: "0",
  name: "",
  details: "",
  instructor: CONTRACT_OWNER_ADDRESS,
  price: "0.01",
  maxStudents: "100",
};

function toUintFromSbtc(amount: string): bigint {
  const normalized = amount.trim();
  if (!normalized) {
    throw new Error("Price is required");
  }
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Price must be a numeric value");
  }
  const [whole, fractional = ""] = normalized.split(".");
  const fracPadded = (fractional + "00000000").slice(0, 8);
  const combined = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "");
  return BigInt(combined || "0");
}

export default function AdminPanel({
  stxAddress,
  stxPubKey,
  httpClient,
  isInstructor: isInstructorProp,
}: AdminPanelProps) {
  const [configuredSbtc, setConfiguredSbtc] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [sbtcInput, setSbtcInput] = useState(CONTRACTS.SBTC_TOKEN);
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [removeAddress, setRemoveAddress] = useState("");
  const [instructorAddress, setInstructorAddress] = useState("");
  const [courseForm, setCourseForm] = useState(() => ({ ...DEFAULT_COURSE }));
  const [completionForm, setCompletionForm] = useState({
    courseId: "",
    student: "",
  });
  const [meetingLinkForm, setMeetingLinkForm] = useState({
    courseId: "",
    link: "",
  });
  const [nftMintAddress, setNftMintAddress] = useState("");
  const [isInstructor, setIsInstructor] = useState(isInstructorProp ?? false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [loadingSbtc, setLoadingSbtc] = useState(false);
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [loadingInstructor, setLoadingInstructor] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [loadingMeetingLink, setLoadingMeetingLink] = useState(false);
  const [loadingNft, setLoadingNft] = useState(false);

  // Check instructor status on mount and when address changes
  useEffect(() => {
    async function checkInstructorStatus() {
      if (!stxAddress) {
        setIsInstructor(false);
        return;
      }

      // Use prop if provided, otherwise fetch from contract
      if (isInstructorProp !== undefined) {
        setIsInstructor(isInstructorProp);
        return;
      }

      try {
        const { checkIsInstructor } = await import(
          "@/app/lib/stacks-client-utils"
        );
        const result = await checkIsInstructor(
          stxAddress,
          CONTRACTS.BTCUNI_MAIN
        );
        setIsInstructor(result);
      } catch (err) {
        console.error("Failed to check instructor status:", err);
        setIsInstructor(false);
      }
    }

    checkInstructorStatus();
  }, [stxAddress, isInstructorProp]);

  const connected = Boolean(stxAddress && stxPubKey && httpClient);

  const refreshConfiguredSbtc = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const { address, name } = parseContractId(CONTRACTS.BTCUNI_MAIN);
      const sender = stxAddress || CONTRACT_OWNER_ADDRESS;
      if (!sender) {
        setConfiguredSbtc(null);
        return;
      }
      const cv = await fetchCallReadOnlyFunction({
        contractAddress: address,
        contractName: name,
        functionName: "get-sbtc-contract",
        functionArgs: [],
        senderAddress: sender,
        network: STACKS_NETWORK,
      });
      const parsed = cvToValue(cv) as any;
      setConfiguredSbtc(parsed?.value || null);
    } catch (err) {
      console.error("Failed to load configured sBTC contract:", err);
      setConfiguredSbtc(null);
    } finally {
      setLoadingConfig(false);
    }
  }, [stxAddress]);

  useEffect(() => {
    refreshConfiguredSbtc();
  }, [refreshConfiguredSbtc]);

  const ensureInstructorReady = () => {
    if (!isInstructor) {
      throw new Error("Only authorized instructors can perform this action");
    }
    if (!connected) {
      throw new Error("Connect your Turnkey wallet to continue");
    }
  };

  const handleSetSbtc = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingSbtc(true);
    try {
      ensureInstructorReady();
      const principal = getContractPrincipalCV(sbtcInput);
      const mainContract = parseContractId(CONTRACTS.BTCUNI_MAIN);
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: mainContract.address,
          contractName: mainContract.name,
          functionName: "set-sbtc-contract",
          functionArgs: [principal],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      toast.success(`Transaction sent: ${txId.slice(0, 10)}…`);
      await refreshConfiguredSbtc();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(message);
    } finally {
      setLoadingSbtc(false);
    }
  };

  const handleWhitelist = async (
    type: "add" | "remove",
    address: string,
    reset: () => void
  ) => {
    if (type === "add") {
      setLoadingWhitelist(true);
    } else {
      setLoadingRemove(true);
    }
    try {
      ensureInstructorReady();
      const trimmed = address.trim();
      if (!trimmed) {
        throw new Error("Address is required");
      }
      const functionName =
        type === "add" ? "add-whitelist" : "remove-whitelist";
      const mainContract = parseContractId(CONTRACTS.BTCUNI_MAIN);
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: mainContract.address,
          contractName: mainContract.name,
          functionName,
          functionArgs: [principalCV(trimmed)],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      toast.success(`Transaction sent: ${txId.slice(0, 10)}…`);
      reset();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Whitelist update failed";
      toast.error(message);
    } finally {
      if (type === "add") {
        setLoadingWhitelist(false);
      } else {
        setLoadingRemove(false);
      }
    }
  };

  const handleAddInstructor = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingInstructor(true);
    try {
      ensureInstructorReady();
      if (!instructorAddress.trim()) {
        throw new Error("Instructor address is required");
      }
      const mainContract = parseContractId(CONTRACTS.BTCUNI_MAIN);
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: mainContract.address,
          contractName: mainContract.name,
          functionName: "add-instructor",
          functionArgs: [principalCV(instructorAddress.trim())],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      toast.success(`Transaction sent: ${txId.slice(0, 10)}…`);
      setInstructorAddress("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to add instructor";
      toast.error(message);
    } finally {
      setLoadingInstructor(false);
    }
  };

  const handleAddCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingCourse(true);
    try {
      ensureInstructorReady();
      if (!courseForm.name.trim() || !courseForm.details.trim()) {
        throw new Error("Course name and description are required");
      }
      const courseId = BigInt(courseForm.courseId || "0");
      const priceUint = toUintFromSbtc(courseForm.price);
      const maxStudents = BigInt(courseForm.maxStudents || "0");
      const mainContract = parseContractId(CONTRACTS.BTCUNI_MAIN);
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: mainContract.address,
          contractName: mainContract.name,
          functionName: "add-course",
          functionArgs: [
            Cl.uint(courseId),
            Cl.stringAscii(courseForm.name.trim()),
            Cl.stringAscii(courseForm.details.trim()),
            principalCV(courseForm.instructor.trim()),
            Cl.uint(priceUint),
            Cl.uint(maxStudents),
          ],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      toast.success(`Transaction sent: ${txId.slice(0, 10)}…`);
      setCourseForm({ ...DEFAULT_COURSE });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to add course";
      toast.error(message);
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleSetMeetingLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingMeetingLink(true);
    try {
      ensureInstructorReady();
      if (!meetingLinkForm.courseId || !meetingLinkForm.link.trim()) {
        throw new Error("Course ID and meeting link are required");
      }
      const mainContract = parseContractId(CONTRACTS.BTCUNI_MAIN);
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: mainContract.address,
          contractName: mainContract.name,
          functionName: "set-meeting-link",
          functionArgs: [
            uintCV(Number(meetingLinkForm.courseId)),
            Cl.stringAscii(meetingLinkForm.link.trim()),
          ],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      toast.success(`Transaction sent: ${txId.slice(0, 10)}…`);
      setMeetingLinkForm({ courseId: "", link: "" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to set meeting link";
      toast.error(message);
    } finally {
      setLoadingMeetingLink(false);
    }
  };

  const handleCompleteCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingCompletion(true);
    try {
      ensureInstructorReady();
      if (!completionForm.courseId || !completionForm.student.trim()) {
        throw new Error("Course ID and student address are required");
      }
      const mainContract = parseContractId(CONTRACTS.BTCUNI_MAIN);
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: mainContract.address,
          contractName: mainContract.name,
          functionName: "complete-course",
          functionArgs: [
            uintCV(Number(completionForm.courseId)),
            principalCV(completionForm.student.trim()),
          ],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      toast.success(`Transaction sent: ${txId.slice(0, 10)}…`);
      setCompletionForm({ courseId: "", student: "" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to complete course";
      toast.error(message);
    } finally {
      setLoadingCompletion(false);
    }
  };

  const handleMintNft = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingNft(true);
    try {
      ensureInstructorReady();
      if (!nftMintAddress.trim()) {
        throw new Error("Student address is required");
      }

      const nftContract = parseContractId(CONTRACTS.BTCUNI_NFT);
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: nftContract.address,
          contractName: nftContract.name,
          functionName: "mint-for-student",
          functionArgs: [principalCV(nftMintAddress.trim())],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      toast.success(`Transaction sent: ${txId.slice(0, 10)}…`);
      setNftMintAddress("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to mint NFT";
      toast.error(message);
    } finally {
      setLoadingNft(false);
    }
  };

  const instructorBadge = isInstructor ? (
    <span className="w-fit inline-flex  items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
      <ShieldCheck className="w-4 h-4" />
      Instructor wallet connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full bg-red-100 text-red-800">
      <Lock className="w-4 h-4" />
      Instructor verification required
    </span>
  );

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row ">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Instructor Console</h3>
          <p className="text-sm text-gray-600">
            Manage whitelist, courses, and sBTC configuration directly on-chain.
          </p>
        </div>
        {instructorBadge}
      </div>

      {/* Main Instructor Actions - 2x2 Grid */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Course Management</h4>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={handleAddCourse}
          className="border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BookPlus className="w-4 h-4" />
            Add/Modify Course
          </p>
          <p>Note: no special symbols, no em-dash, or will fail</p>
          <div>
            <label className="text-xs text-gray-500">
              Course ID (0 for new, existing ID to modify)
            </label>
            <input
              type="number"
              min={0}
              value={courseForm.courseId}
              onChange={(e) =>
                setCourseForm((prev) => ({
                  ...prev,
                  courseId: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <input
            type="text"
            value={courseForm.name}
            onChange={(e) =>
              setCourseForm((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Course name"
          />
          <textarea
            value={courseForm.details}
            onChange={(e) =>
              setCourseForm((prev) => ({ ...prev, details: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Course details"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Price (sBTC)</label>
              <input
                type="text"
                value={courseForm.price}
                onChange={(e) =>
                  setCourseForm((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Max Students</label>
              <input
                type="number"
                min={0}
                value={courseForm.maxStudents}
                onChange={(e) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    maxStudents: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Instructor Address</label>
            <input
              type="text"
              value={courseForm.instructor}
              onChange={(e) =>
                setCourseForm((prev) => ({
                  ...prev,
                  instructor: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!isInstructor || !connected || loadingCourse}
            className="w-full rounded-lg bg-orange-500 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingCourse ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <BookPlus className="w-4 h-4" />
                Deploy/Modify Course
              </>
            )}
          </button>
        </form>

        <form
          onSubmit={handleCompleteCourse}
          className="border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Mark Completion
          </p>
          <input
            type="number"
            min={1}
            value={completionForm.courseId}
            onChange={(e) =>
              setCompletionForm((prev) => ({
                ...prev,
                courseId: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Course ID"
          />
          <input
            type="text"
            value={completionForm.student}
            onChange={(e) =>
              setCompletionForm((prev) => ({
                ...prev,
                student: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
            placeholder="Student STX address"
          />
          <button
            type="submit"
            disabled={!isInstructor || !connected || loadingCompletion}
            className="w-full rounded-lg bg-blue-600 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingCompletion ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Update Student Progress
              </>
            )}
          </button>
        </form>

        <form
          onSubmit={handleMintNft}
          className="border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Mint NFT Certificate
          </p>
          <input
            type="text"
            value={nftMintAddress}
            onChange={(e) => setNftMintAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
            placeholder="Student STX address"
          />
          <button
            type="submit"
            disabled={!isInstructor || !connected || loadingNft}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-yellow-400 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingNft ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                Mint Certificate NFT
              </>
            )}
          </button>
          <p className="text-xs text-gray-500">
            Grant a completion certificate NFT to a student (one per student)
          </p>
        </form>

        <form
          onSubmit={handleSetMeetingLink}
          className="border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BookPlus className="w-4 h-4" />
            Set Meeting Link
          </p>
          <p>Do not include https:// or it will fail.</p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-gray-500">Course ID</label>
              <input
                type="number"
                min={1}
                value={meetingLinkForm.courseId}
                onChange={(e) =>
                  setMeetingLinkForm((prev) => ({
                    ...prev,
                    courseId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Course ID"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Meeting Link</label>
              <input
                type="text"
                value={meetingLinkForm.link}
                onChange={(e) =>
                  setMeetingLinkForm((prev) => ({
                    ...prev,
                    link: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://zoom.us/j/..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!isInstructor || !connected || loadingMeetingLink}
            className="w-full rounded-lg bg-purple-600 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingMeetingLink ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <BookPlus className="w-4 h-4" />
                Set Meeting Link
              </>
            )}
          </button>
        </form>
      </div>
      </div>


      {/* Advanced Settings Accordion */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gray-700" />
            <h4 className="text-lg font-semibold text-gray-900">Advanced Settings</h4>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-6 space-y-6 bg-white">
            <div className="grid gap-6 md:grid-cols-2">
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Configured sBTC Contract
              </p>
              <p className="font-mono text-sm text-gray-900 break-all">
                {configuredSbtc || "Not set"}
              </p>
            </div>
            <button
              onClick={refreshConfiguredSbtc}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loadingConfig}
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingConfig ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
          <form onSubmit={handleSetSbtc} className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">
              Set sBTC Contract
            </label>
            <input
              type="text"
              value={sbtcInput}
              onChange={(e) => setSbtcInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
              placeholder="ST...contract"
            />
            <button
              type="submit"
              disabled={!isInstructor || !connected || loadingSbtc}
              className="w-full rounded-lg bg-gray-900 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingSbtc ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update sBTC Contract"
              )}
            </button>
          </form>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Instructor Management
          </p>
          <form onSubmit={handleAddInstructor} className="space-y-3">
            <input
              type="text"
              value={instructorAddress}
              onChange={(e) => setInstructorAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
              placeholder="Instructor STX address"
            />
            <button
              type="submit"
              disabled={!isInstructor || !connected || loadingInstructor}
              className="w-full rounded-lg bg-indigo-600 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingInstructor ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Instructor
                </>
              )}
            </button>
          </form>
        </div>
      </div>

            <div className="border border-gray-200 rounded-xl p-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Whitelist Controls
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleWhitelist("add", whitelistAddress, () =>
                    setWhitelistAddress("")
                  );
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={whitelistAddress}
                  onChange={(e) => setWhitelistAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                  placeholder="Student STX address"
                />
                <button
                  type="submit"
                  disabled={!isInstructor || !connected || loadingWhitelist}
                  className="w-full rounded-lg bg-green-600 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingWhitelist ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add to Whitelist
                    </>
                  )}
                </button>
              </form>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleWhitelist("remove", removeAddress, () =>
                    setRemoveAddress("")
                  );
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={removeAddress}
                  onChange={(e) => setRemoveAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                  placeholder="Student STX address"
                />
                <button
                  type="submit"
                  disabled={!isInstructor || !connected || loadingRemove}
                  className="w-full rounded-lg bg-red-600 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingRemove ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Remove from Whitelist
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {!isInstructor && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
          Connect with an authorized instructor wallet to enable admin controls. 
          Contact the contract owner ({CONTRACT_OWNER_ADDRESS}) to request instructor access. 
          The interface stays visible so you can preview available actions even when read-only.
        </div>
      )}
    </section>
  );
}
