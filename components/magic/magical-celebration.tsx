"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  vx: number;
  vy: number;
}

const COLORS = ["#000000", "#ffffff", "#004a99", "#16a34a", "#facc15", "#f97316"];

export function MagicalCelebration({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      const newParticles: Particle[] = Array.from({ length: 50 }).map((_, i) => ({
        id: Date.now() + i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 15 + 10,
        rotation: Math.random() * 360,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 10,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: 1, scale: 1, rotate: p.rotation }}
            animate={{
              x: p.x + p.vx * 50,
              y: p.y + p.vy * 50 + 500, // gravity simulation
              opacity: 0,
              scale: 0,
              rotate: p.rotation + 720,
            }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{
              position: "absolute",
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
