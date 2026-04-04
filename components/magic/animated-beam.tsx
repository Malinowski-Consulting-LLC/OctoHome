"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/magic-utils";
import { RefObject, useEffect, useMemo, useState } from "react";

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
}

export const AnimatedBeam = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 2,
  delay = 0,
}: AnimatedBeamProps) => {
  const [path, setPath] = useState("");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const fromRect = fromRef.current.getBoundingClientRect();
        const toRect = toRef.current.getBoundingClientRect();

        const startX = fromRect.left - containerRect.left + fromRect.width / 2;
        const startY = fromRect.top - containerRect.top + fromRect.height / 2;
        const endX = toRect.left - containerRect.left + toRect.width / 2;
        const endY = toRect.top - containerRect.top + toRect.height / 2;

        const controlX = (startX + endX) / 2;
        const controlY = (startY + endY) / 2 - curvature;

        setPath(`M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`);
      }
    };

    updatePath();
    window.addEventListener("resize", updatePath);
    return () => window.removeEventListener("resize", updatePath);
  }, [containerRef, fromRef, toRef, curvature]);

  return (
    <svg
      fill="none"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute left-0 top-0 z-0",
        className
      )}
    >
      <path
        d={path}
        stroke="black"
        strokeWidth="4"
        strokeOpacity="0.1"
        strokeLinecap="round"
      />
      <motion.path
        d={path}
        stroke="black"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, pathOffset: 0 }}
        animate={shouldReduceMotion ? { pathLength: 1 } : { 
          pathLength: [0, 0.2, 0],
          pathOffset: [0, 1, 1],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </svg>
  );
};
