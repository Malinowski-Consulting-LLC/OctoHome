"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  color: string;
  size: number;
  rotation: number;
  travelX: number;
  travelY: number;
}

const COLORS = ["#000000", "#ffffff", "#004a99", "#16a34a", "#facc15", "#f97316"];
const PARTICLES: Particle[] = Array.from({ length: 50 }, (_, i) => {
  const angle = (i / 50) * Math.PI * 2;
  const speed = 12 + (i % 5) * 3;

  return {
    id: i,
    color: COLORS[i % COLORS.length],
    size: 10 + (i % 4) * 3,
    rotation: (i * 37) % 360,
    travelX: Math.cos(angle) * speed * 10,
    travelY: Math.sin(angle) * speed * 10 + 300,
  };
});

export function MagicalCelebration({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  return (
    <div className="absolute inset-0 z-[100] overflow-hidden pointer-events-none">
      <AnimatePresence>
        {active &&
          PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: p.rotation }}
            animate={{
              x: p.travelX,
              y: p.travelY,
              opacity: 0,
              scale: 0,
              rotate: p.rotation + 720,
            }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              border: "2px solid black",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
