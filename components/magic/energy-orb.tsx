"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/magic-utils";

interface EnergyOrbProps {
  state: "idle" | "thinking" | "speaking" | "error";
  className?: string;
}

export const EnergyOrb = ({ state, className }: EnergyOrbProps) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    idle: {
      scale: [1, 1.05, 1],
      rotate: 0,
      opacity: 0.8,
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    thinking: {
      scale: [1, 1.1, 1],
      rotate: [0, 180, 360],
      opacity: 1,
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    speaking: {
      scale: [1, 1.2, 0.9, 1.1, 1],
      opacity: 1,
      transition: { duration: 0.5, repeat: Infinity }
    },
    error: {
      scale: [1, 0.95, 1.05, 1],
      x: [0, -2, 2, -2, 0],
      opacity: 1,
      transition: { duration: 0.2, repeat: Infinity }
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)} aria-hidden="true">
      {/* Background Glow */}
      <motion.div
        animate={shouldReduceMotion ? {} : variants[state]}
        className={cn(
          "absolute w-full h-full rounded-full blur-2xl opacity-50",
          state === "idle" && "bg-zinc-400",
          state === "thinking" && "bg-blue-500",
          state === "speaking" && "bg-green-500",
          state === "error" && "bg-red-500"
        )}
      />
      
      {/* Core Orb */}
      <motion.div
        animate={shouldReduceMotion ? {} : variants[state]}
        className={cn(
          "relative w-3/4 h-3/4 border-8 border-black bg-white rounded-full flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
          state === "thinking" && "border-blue-600",
          state === "speaking" && "border-green-600",
          state === "error" && "border-red-600"
        )}
      >
        <div className={cn(
          "w-4 h-4 rounded-full",
          state === "idle" && "bg-black",
          state === "thinking" && "bg-blue-600 animate-pulse",
          state === "speaking" && "bg-green-600",
          state === "error" && "bg-red-600"
        )} />
      </motion.div>

      {/* Screen Reader Label */}
      <div className="sr-only" aria-live="polite">
        AI Copilot is currently {state}
      </div>
    </div>
  );
};
