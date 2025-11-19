"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { uintCV, fetchCallReadOnlyFunction, cvToValue } from "@stacks/transactions";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  Lock,
  Play,
  FileText,
  Users,
  Video,
} from "lucide-react";
import {
  signAndBroadcastContractCall,
  CONTRACTS,
  STACKS_NETWORK,
} from "@/app/lib/stacks-client-utils";
import { getSbtcContractPrincipalCV } from "@/app/lib/contract-helpers";
import { parseContractId } from "@/app/lib/contracts";
import { useAuth } from "@/app/contexts/AuthContext";

const COURSES_DATA = {
  1: {
    id: 1,
    title: "Start with Bitcoin",
    description:
      "Learn what Bitcoin is, how it works, and how to use it safely — even if you're brand new.",
    emoji: "💰",
    price: "0.01 sBTC",
    duration: "2 hours",
    level: "Beginner",
    students: 1234,
    lessons: [
      { id: 1, title: "What is Bitcoin?", duration: "15 min", type: "video" },
      { id: 2, title: "How Bitcoin Works", duration: "20 min", type: "video" },
      {
        id: 3,
        title: "Bitcoin Wallets Explained",
        duration: "18 min",
        type: "video",
      },
      {
        id: 4,
        title: "Buying Your First Bitcoin",
        duration: "25 min",
        type: "video",
      },
      {
        id: 5,
        title: "Storing Bitcoin Safely",
        duration: "22 min",
        type: "video",
      },
      { id: 6, title: "Final Quiz", duration: "20 min", type: "quiz" },
    ],
    outcomes: [
      "Understand the fundamentals of Bitcoin",
      "Set up and secure a Bitcoin wallet",
      "Make your first Bitcoin transaction",
      "Learn best practices for Bitcoin security",
    ],
  },
  2: {
    id: 2,
    title: "Easy Bitcoin & Stacks",
    description:
      "A simple guide to understanding Bitcoin and the Stacks network — no tech skills needed!",
    emoji: "⚡",
    price: "0.01 sBTC",
    duration: "3 hours",
    level: "Beginner",
    students: 987,
    lessons: [
      {
        id: 1,
        title: "Introduction to Stacks",
        duration: "20 min",
        type: "video",
      },
      {
        id: 2,
        title: "Stacks and Bitcoin Layer",
        duration: "25 min",
        type: "video",
      },
      {
        id: 3,
        title: "Smart Contracts Basics",
        duration: "30 min",
        type: "video",
      },
      {
        id: 4,
        title: "Building on Bitcoin",
        duration: "35 min",
        type: "video",
      },
      { id: 5, title: "Stacks Ecosystem", duration: "30 min", type: "video" },
      { id: 6, title: "Final Assessment", duration: "20 min", type: "quiz" },
    ],
    outcomes: [
      "Understand the Stacks blockchain",
      "Learn how Stacks extends Bitcoin",
      "Explore smart contract capabilities",
      "Discover the Stacks ecosystem",
    ],
  },
  3: {
    id: 3,
    title: "Bitcoin Made Simple",
    description:
      "Understand Bitcoin in plain language — how to buy, store, and use it with confidence.",
    emoji: "🔗",
    price: "0.01 sBTC",
    duration: "2.5 hours",
    level: "Beginner",
    students: 1567,
    lessons: [
      { id: 1, title: "Bitcoin Basics", duration: "18 min", type: "video" },
      {
        id: 2,
        title: "Blockchain Technology",
        duration: "22 min",
        type: "video",
      },
      {
        id: 3,
        title: "Mining and Transactions",
        duration: "25 min",
        type: "video",
      },
      { id: 4, title: "Bitcoin Economics", duration: "20 min", type: "video" },
      {
        id: 5,
        title: "Using Bitcoin Daily",
        duration: "25 min",
        type: "video",
      },
      {
        id: 6,
        title: "Course Completion Test",
        duration: "20 min",
        type: "quiz",
      },
    ],
    outcomes: [
      "Master Bitcoin fundamentals",
      "Understand blockchain technology",
      "Learn about Bitcoin economics",
      "Use Bitcoin in everyday life",
    ],
  },
  4: {
    id: 4,
    title: "Intro to Stacks: Apps on Bitcoin",
    description:
      "Discover how people are building cool apps on Bitcoin using Stacks — explained step by step.",
    emoji: "🚀",
    price: "0.01 sBTC",
    duration: "4 hours",
    level: "Intermediate",
    students: 756,
    lessons: [
      {
        id: 1,
        title: "Stacks Architecture",
        duration: "30 min",
        type: "video",
      },
      {
        id: 2,
        title: "Clarity Smart Contracts",
        duration: "35 min",
        type: "video",
      },
      { id: 3, title: "Building dApps", duration: "40 min", type: "video" },
      { id: 4, title: "Stacks APIs", duration: "35 min", type: "video" },
      {
        id: 5,
        title: "Deployment Strategies",
        duration: "40 min",
        type: "video",
      },
      { id: 6, title: "Final Project", duration: "40 min", type: "quiz" },
    ],
    outcomes: [
      "Build applications on Stacks",
      "Write Clarity smart contracts",
      "Deploy decentralized apps",
      "Integrate with Stacks APIs",
    ],
  },
  5: {
    id: 5,
    title: "From Zero to Bitcoin Hero",
    description:
      "Start from zero and learn the basics of Bitcoin, wallets, and how to join the new digital world.",
    emoji: "🧠",
    price: "0.01 sBTC",
    duration: "5 hours",
    level: "Beginner",
    students: 2103,
    lessons: [
      {
        id: 1,
        title: "Complete Bitcoin Introduction",
        duration: "35 min",
        type: "video",
      },
      {
        id: 2,
        title: "Setting Up Your Wallet",
        duration: "30 min",
        type: "video",
      },
      { id: 3, title: "Understanding Keys", duration: "40 min", type: "video" },
      {
        id: 4,
        title: "Making Transactions",
        duration: "45 min",
        type: "video",
      },
      { id: 5, title: "Advanced Security", duration: "50 min", type: "video" },
      { id: 6, title: "Bitcoin Community", duration: "40 min", type: "video" },
      { id: 7, title: "Final Certification", duration: "30 min", type: "quiz" },
    ],
    outcomes: [
      "Complete Bitcoin mastery",
      "Advanced wallet management",
      "Expert security practices",
      "Join the Bitcoin community",
    ],
  },
};

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.id as string);
  const { stxAddress, stxPubKey, httpClient } = useAuth();

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    new Set()
  );
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const course = COURSES_DATA[courseId as keyof typeof COURSES_DATA];

  // Check enrollment status
  useEffect(() => {
    if (!stxAddress) return;

    const checkStatus = async () => {
      try {
        const whitelistRes = await fetch("/api/contract/check-whitelist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: stxAddress }),
        });
        const whitelistData = await whitelistRes.json();
        if (whitelistData.success) {
          setIsWhitelisted(whitelistData.isWhitelisted);
        }

        if (whitelistData.isWhitelisted) {
          const enrollRes = await fetch("/api/contract/get-enrolled-ids", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: stxAddress }),
          });
          const enrollData = await enrollRes.json();
          if (enrollData.success && enrollData.enrolledIds) {
            setIsEnrolled(enrollData.enrolledIds.includes(courseId));
          }
        }
      } catch (err) {
        console.error("Status check failed:", err);
      }
    };

    checkStatus();
  }, [stxAddress, courseId]);

  // Fetch meeting link for enrolled students
  useEffect(() => {
    if (!isEnrolled || !courseId) return;

    const fetchMeetingLink = async () => {
      try {
        const { address, name } = parseContractId(CONTRACTS.BTCUNI_MAIN);
        const result = await fetchCallReadOnlyFunction({
          contractAddress: address,
          contractName: name,
          functionName: "get-meeting-link",
          functionArgs: [uintCV(courseId)],
          network: STACKS_NETWORK,
          senderAddress: address,
        });
        const linkData = cvToValue(result);
        if (linkData?.value?.value?.link) {
          setMeetingLink(linkData.value.value.link);
        }
      } catch (err) {
        console.error("Failed to fetch meeting link:", err);
      }
    };

    fetchMeetingLink();
  }, [isEnrolled, courseId]);

  const handleEnrollCourse = async () => {
    if (!stxPubKey || !stxAddress || !httpClient) {
      setToast({ type: "error", message: "Wallet not connected" });
      return;
    }

    if (!isWhitelisted) {
      setToast({ type: "error", message: "You must be whitelisted first" });
      return;
    }

    setEnrolling(true);
    try {
      const sbtcPrincipal = getSbtcContractPrincipalCV();
      const txId = await signAndBroadcastContractCall(
        {
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: "btc-university",
          functionName: "enroll-course",
          functionArgs: [uintCV(courseId), sbtcPrincipal],
          senderAddress: stxAddress,
          senderPubKey: stxPubKey,
        },
        httpClient
      );

      setToast({
        type: "success",
        message: `Enrollment successful! Transaction: ${txId}`,
      });
      setIsEnrolled(true);
    } catch (err) {
      console.error("Course enrollment error:", err);
      const message = err instanceof Error ? err.message : "Enrollment failed";
      setToast({ type: "error", message });
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonComplete = (lessonId: number) => {
    setCompletedLessons((prev) => new Set(prev).add(lessonId));
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Course Not Found
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progress = (completedLessons.size / course.lessons.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-semibold max-w-md ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </motion.div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 border border-gray-200"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-2xl text-4xl">
                  {course.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {course.level}
                    </span>
                    {isEnrolled && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Enrolled
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {course.title}
                  </h1>
                  <p className="text-gray-600 text-lg">{course.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lessons.length} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.students.toLocaleString()} students</span>
                </div>
              </div>

              {isEnrolled && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Your Progress
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Course Content */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Course Content
              </h2>
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.has(lesson.id);
                  const isLocked = !isEnrolled;

                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isCompleted
                          ? "bg-green-50 border-green-200"
                          : isLocked
                          ? "bg-gray-50 border-gray-200"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
                      }`}
                      onClick={() =>
                        !isLocked && handleLessonComplete(lesson.id)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            isCompleted
                              ? "bg-green-200"
                              : isLocked
                              ? "bg-gray-200"
                              : "bg-blue-100"
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="w-5 h-5 text-gray-500" />
                          ) : isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : lesson.type === "video" ? (
                            <Play className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Lesson {lesson.id}: {lesson.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {lesson.duration}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          lesson.type === "quiz"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {lesson.type}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Learning Outcomes */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                What You'll Learn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{outcome}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-6"
            >
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {course.price}
                </p>
                <p className="text-sm text-gray-600">One-time payment</p>
              </div>

              {isEnrolled ? (
                <div className="space-y-3">
                  <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Continue Learning
                  </button>
                  {meetingLink && (
                    <a
                      href={meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Video className="w-5 h-5" />
                      Join Live Session
                    </a>
                  )}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-900">
                      You're enrolled!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleEnrollCourse}
                    disabled={enrolling || !isWhitelisted}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                  >
                    {enrolling ? "Enrolling..." : "Enroll Now (0.01 sBTC)"}
                  </button>
                  {!isWhitelisted && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <Lock className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                      <p className="text-xs text-yellow-900 text-center">
                        Whitelist enrollment required
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Duration</span>
                  <span className="font-semibold text-gray-900">
                    {course.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lessons</span>
                  <span className="font-semibold text-gray-900">
                    {course.lessons.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Level</span>
                  <span className="font-semibold text-gray-900">
                    {course.level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Certificate</span>
                  <span className="font-semibold text-gray-900">NFT</span>
                </div>
              </div>
            </motion.div>

            {/* Certificate Preview */}
            {isEnrolled && progress === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-orange-500 to-yellow-400 rounded-2xl p-6 text-white"
              >
                <Award className="w-12 h-12 mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2 text-center">
                  Congratulations!
                </h3>
                <p className="text-sm text-center mb-4 text-white/90">
                  You've completed this course. Claim your NFT certificate!
                </p>
                <button className="w-full py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                  Claim Certificate
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
