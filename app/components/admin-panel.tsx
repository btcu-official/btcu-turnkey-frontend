"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

interface AdminPanelProps {
  stxAddress: string;
  stxPubKey: string;
  httpClient: TurnkeySDKClientBase | null | undefined;
}

interface ToastState {
  type: "success" | "error";
  message: string;
}

const DEFAULT_COURSE = {
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
}: AdminPanelProps) {
  const [configuredSbtc, setConfiguredSbtc] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [status, setStatus] = useState<ToastState | null>(null);
  const [sbtcInput, setSbtcInput] = useState(CONTRACTS.SBTC_TOKEN);
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [removeAddress, setRemoveAddress] = useState("");
  const [courseForm, setCourseForm] = useState(() => ({ ...DEFAULT_COURSE }));
  const [completionForm, setCompletionForm] = useState({
    courseId: "",
    student: "",
  });

  const ownerAddress = CONTRACT_OWNER_ADDRESS;
  const isOwner = useMemo(() => {
    if (!ownerAddress || !stxAddress) return false;
    return ownerAddress.toUpperCase() === stxAddress.toUpperCase();
  }, [ownerAddress, stxAddress]);

  const connected = Boolean(stxAddress && stxPubKey && httpClient);

  const showError = (message: string) =>
    setStatus({
      type: "error",
      message,
    });

  const showSuccess = (message: string) =>
    setStatus({
      type: "success",
      message,
    });

  const refreshConfiguredSbtc = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const { address, name } = parseContractId(CONTRACTS.BTCUNI_MAIN);
      const sender = stxAddress || ownerAddress;
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
  }, [ownerAddress, stxAddress]);

  useEffect(() => {
    refreshConfiguredSbtc();
  }, [refreshConfiguredSbtc]);

  useEffect(() => {
    if (!status) return;
    const timeout = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(timeout);
  }, [status]);

  const ensureOwnerReady = () => {
    if (!isOwner) {
      throw new Error("Only the contract owner can perform this action");
    }
    if (!connected) {
      throw new Error("Connect your Turnkey wallet to continue");
    }
  };

  const handleSetSbtc = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      ensureOwnerReady();
      const principal = getContractPrincipalCV(sbtcInput);
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: "btc-university",
          functionName: "set-sbtc-contract",
          functionArgs: [principal],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      showSuccess(`sBTC contract updated (tx ${txId.slice(0, 10)}…)`);
      await refreshConfiguredSbtc();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      showError(message);
    }
  };

  const handleWhitelist = async (
    type: "add" | "remove",
    address: string,
    reset: () => void
  ) => {
    try {
      ensureOwnerReady();
      const trimmed = address.trim();
      if (!trimmed) {
        throw new Error("Address is required");
      }
      const functionName =
        type === "add" ? "add-whitelist" : "remove-whitelist";
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: "btc-university",
          functionName,
          functionArgs: [principalCV(trimmed)],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient!
      );
      showSuccess(
        `${
          type === "add" ? "Added" : "Removed"
        } whitelist entry (tx ${txId.slice(0, 10)}…)`
      );
      reset();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Whitelist update failed";
      showError(message);
    }
  };

  const handleAddCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      ensureOwnerReady();
      if (!courseForm.name.trim() || !courseForm.details.trim()) {
        throw new Error("Course name and description are required");
      }
      const priceUint = toUintFromSbtc(courseForm.price);
      const maxStudents = BigInt(courseForm.maxStudents || "0");
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: "btc-university",
          functionName: "add-course",
          functionArgs: [
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
      showSuccess(`Course added (tx ${txId.slice(0, 10)}…)`);
      setCourseForm({ ...DEFAULT_COURSE });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to add course";
      showError(message);
    }
  };

  const handleCompleteCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      ensureOwnerReady();
      if (!completionForm.courseId || !completionForm.student.trim()) {
        throw new Error("Course ID and student address are required");
      }
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: "btc-university",
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
      showSuccess(`Course completion submitted (tx ${txId.slice(0, 10)}…)`);
      setCompletionForm({ courseId: "", student: "" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to complete course";
      showError(message);
    }
  };

  const ownerBadge = isOwner ? (
    <span className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
      <ShieldCheck className="w-4 h-4" />
      Owner wallet connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full bg-red-100 text-red-800">
      <Lock className="w-4 h-4" />
      Owner verification required
    </span>
  );

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Admin Console</h3>
          <p className="text-sm text-gray-600">
            Manage whitelist, courses, and sBTC configuration directly on-chain.
          </p>
        </div>
        {ownerBadge}
      </div>

      {status && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            status.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <CheckCircle2
            className={`w-5 h-5 ${
              status.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          />
          <p>{status.message}</p>
        </div>
      )}

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
              disabled={!isOwner || !connected}
              className="w-full rounded-lg bg-gray-900 text-white py-2 font-semibold disabled:opacity-50"
            >
              Update sBTC Contract
            </button>
          </form>
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
              disabled={!isOwner || !connected}
              className="w-full rounded-lg bg-green-600 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add to Whitelist
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
              disabled={!isOwner || !connected}
              className="w-full rounded-lg bg-red-600 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserMinus className="w-4 h-4" />
              Remove from Whitelist
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={handleAddCourse}
          className="border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BookPlus className="w-4 h-4" />
            Add Course
          </p>
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
            disabled={!isOwner || !connected}
            className="w-full rounded-lg bg-orange-500 text-white py-2 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <BookPlus className="w-4 h-4" />
            Deploy Course
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
            disabled={!isOwner || !connected}
            className="w-full rounded-lg bg-blue-600 text-white py-2 font-semibold disabled:opacity-50"
          >
            Update Student Progress
          </button>
        </form>
      </div>

      {!isOwner && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
          Connect with the contract owner's Turnkey wallet (
          {CONTRACT_OWNER_ADDRESS}) to enable admin controls. The interface
          stays visible so you can preview available actions even when
          read-only.
        </div>
      )}
    </section>
  );
}
