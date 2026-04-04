"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/magic-utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon: any;
  description: string;
  href: string;
  cta: string;
}) => (
  <motion.div
    whileHover={{ y: -5, x: 5 }}
    className={cn(
      "group relative flex flex-col justify-between overflow-hidden border-8 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] transition-all",
      className
    )}
  >
    <div className="absolute inset-0 z-0">{background}</div>
    <div className="pointer-events-none z-10 flex flex-col gap-1 p-8 transition-all duration-300">
      <Icon className="h-16 w-16 origin-left transform-gpu text-black transition-all duration-300 ease-in-out group-hover:scale-75" />
      <h3 className="text-4xl font-black uppercase italic tracking-tighter text-black">
        {name}
      </h3>
      <p className="max-w-lg text-xl font-bold uppercase text-zinc-500">{description}</p>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 flex w-full translate-y-10 flex-row items-center p-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
      )}
    >
      <button className="pointer-events-auto border-4 border-black bg-black px-6 py-2 font-black uppercase text-white hover:bg-zinc-800">
        {cta}
      </button>
    </div>
    <div className="pointer-events-none absolute inset-0 transition-all duration-300 group-hover:bg-black/[.03]" />
  </motion.div>
);
