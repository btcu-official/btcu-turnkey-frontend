"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

interface Step {
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  action?: () => void;
}

export default function LearningPath() {
  const { wallets, handleLogin } = useAuth();
  const router = useRouter();

  const [steps, setSteps] = React.useState<Step[]>([
    {
      title: "Create Wallet",
      description: "Your first step into Bitcoin",
      xp: 100,
      completed: false,
      action: () => handleLogin(),
    },
    {
      title: "Join Whitelist",
      description: "Get whitelisted to access courses",
      xp: 100,
      completed: false,
      action: () => router.push("/dashboard"),
    },
    {
      title: "Enroll in Course",
      description: "Start learning and earning",
      xp: 100,
      completed: false,
      action: () => router.push("/dashboard"),
    },
    {
      title: "Mint Certificate",
      description: "Proof of your achievement",
      xp: 100,
      completed: false,
      action: () => router.push("/dashboard"),
    },
  ]);

  // Update wallet creation step
  React.useEffect(() => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === 0 ? { ...step, completed: wallets.length > 0 } : step
      )
    );
  }, [wallets]);

  const handleStepClick = (index: number) => {
    const step = steps[index];
    if (step.action) {
      step.action();
    }
  };

  const totalXP = steps.reduce((acc, s) => acc + s.xp, 0);
  const earnedXP = steps
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.xp, 0);
  const progress = (earnedXP / totalXP) * 100;

  return (
    <section className="bg-gradient-to-b from-yellow-50 via-white to-orange-50 py-16 px-6 mt-8">
      <div className="max-w-6xl mx-auto text-center space-y-8">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
          Your Learning Path
        </h2>
        <p className="text-gray-700 text-lg md:text-xl">
          Complete each step to earn XP and unlock badges.
        </p>

        {/* XP Progress Bar */}
        <div className="mt-6 text-left max-w-4xl mx-auto">
          <div className="flex justify-between text-sm text-gray-600 mb-1 font-medium">
            <span>Progress</span>
            <span>
              {earnedXP} / {totalXP} XP
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3">
            <motion.div
              className="bg-orange-500 h-3 rounded-full shadow-md"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        {/* Horizontal Cards */}
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleStepClick(index)}
              className={`flex w-80 md:w-96 items-center p-6 rounded-3xl border shadow-2xl cursor-pointer transition-all duration-300 ${
                step.completed
                  ? "bg-green-50 border-green-300 shadow-green-200"
                  : "bg-white border-gray-200 hover:bg-orange-50 hover:shadow-orange-200"
              }`}
            >
              <div className="flex-shrink-0 mr-5">
                {step.completed ? (
                  <CheckCircle className="text-green-500 w-12 h-12" />
                ) : (
                  <Circle className="text-gray-400 w-12 h-12" />
                )}
              </div>
              <div className="text-left">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-700 text-sm md:text-base mt-1">
                  {step.description}
                </p>
                <p className="text-orange-500 font-semibold text-sm md:text-base mt-2">
                  {step.xp} XP
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
