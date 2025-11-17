"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

function HomePage(): React.JSX.Element {
  const { handleLogin, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 bg-white">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <img
            src="btcu-logo.png"
            alt="Bitcoin University"
            className="w-10 h-10 rounded-full"
          />
          <h1 className="text-lg font-bold text-gray-900">
            Bitcoin University
          </h1>
        </div>
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-colors"
              >
                Go to Courses
              </button>
            </>
          ) : (
            <>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Courses
              </button>
              <button
                onClick={() => handleLogin()}
                disabled={isLoading}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-full transition-colors disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Join Now"}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-20 overflow-hidden">
        {/* Decorative Icons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="absolute top-24 left-12 md:left-32 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl"
        >
          📚
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute top-32 right-12 md:right-40 w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl"
        >
          💰
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="absolute bottom-32 left-16 md:left-48 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl"
        >
          🎓
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute bottom-40 right-20 md:right-52 w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl"
        >
          🏆
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="absolute top-1/2 left-8 md:left-24 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-xl"
        >
          ₿
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl w-full text-center space-y-8 relative z-10"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Learn Bitcoin with <span className="text-blue-600">Rewards</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Complete courses, earn real crypto rewards, and build your on-chain
            reputation with verifiable certificates
          </p>

          <div className="flex flex-col items-center gap-6 pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Go to Dashboard
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => handleLogin()}
                disabled={isLoading}
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Start Learning Now"}
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Powered By */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col items-center gap-6 pt-12"
          >
            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
              Powered by
            </p>
            <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
              <div className="flex items-center gap-3">
                <img src="stx.png" alt="Stacks" className="h-8 md:h-10" />
                <span className="text-lg font-semibold text-gray-700">
                  Stacks
                </span>
              </div>
              <div className="flex items-center gap-3">
                <img src="sbtc.avif" alt="sBTC" className="h-8 md:h-10" />
                <span className="text-lg font-semibold text-gray-700">
                  sBTC
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default HomePage;
