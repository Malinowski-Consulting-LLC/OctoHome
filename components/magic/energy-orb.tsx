"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/magic-utils";

import { useAppearanceStore } from "@/store/use-appearance-store";

interface EnergyOrbProps {
  state: "idle" | "thinking" | "speaking" | "error";
  className?: string;
}

export const EnergyOrb = ({ state, className }: EnergyOrbProps) => {
  const shouldReduceMotion = useReducedMotion();
  const magicEnabled = useAppearanceStore((currentState) => currentState.magicEnabled);
  const shouldAnimate = !shouldReduceMotion && magicEnabled;

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
        animate={shouldAnimate ? variants[state] : {}}
        className={cn(
          "absolute inset-2 rounded-full bg-[image:var(--hero-glow)] opacity-40 blur-xl",
          state === "error" && "opacity-30"
        )}
      />
      
      {/* Core Orb */}
      <motion.div
        animate={shouldAnimate ? variants[state] : {}}
        className={cn(
          "relative flex h-3/4 w-3/4 items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] shadow-[var(--shadow-card)]",
          state === "thinking" && "bg-[color:var(--interactive-hover)]",
          state === "speaking" && "border-[color:var(--border-strong)]",
          state === "error" && "border-[color:var(--border-strong)] bg-[color:var(--surface-2)]"
        )}
      >
        <div className={cn(
          "w-4 h-4 rounded-full",
          state === "idle" && "bg-[color:var(--accent-solid)]",
          state === "thinking" && "bg-[color:var(--accent-solid)]",
          state === "speaking" && "bg-[color:var(--accent-solid)] opacity-80",
          state === "error" && "bg-[color:var(--accent-solid)] opacity-60",
          shouldAnimate && state === "thinking" && "animate-pulse-slow"
        )} />
      </motion.div>

      {/* Screen Reader Label */}
      <div className="sr-only" aria-live="polite">
        AI Copilot is currently {state}
      </div>
    </div>
  );
};
