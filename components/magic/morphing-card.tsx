"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/magic-utils";
import { ReactNode } from "react";

interface MorphingCardProps {
  children: ReactNode;
  step: number;
  className?: string;
}

export function MorphingCard({ children, step, className }: MorphingCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layout={!shouldReduceMotion}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "bg-white border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-12 overflow-hidden relative min-w-[400px] max-w-[800px]",
        className
      )}
    >
      {/* Progress Bar (at the top of the card) */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-zinc-100 border-b-4 border-black overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="h-full bg-black"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
          transition={{ duration: 0.4, ease: "backOut" }}
          className="pt-4"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
