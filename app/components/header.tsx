"use client";

import React, { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Header() {
  const { refreshWallets, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <Image
          src="/btcu-logo.png"
          alt="Bitcoin University"
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Bitcoin University
          </h1>
          <p className="text-xs text-gray-500">Powered by Stacks</p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            router.push("/admin");
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Admin</span>
        </button>
        <button
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            refreshWallets();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            logout();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}
