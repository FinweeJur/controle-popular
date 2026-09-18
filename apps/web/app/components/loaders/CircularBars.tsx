"use client";

import React from "react";
import { motion } from "framer-motion";

export interface CircularBarsProps {
  className?: string;
  size?: number;
  cor?: string;
}

export const CircularBars = ({ className = "", size, cor }: CircularBarsProps) => {
  const scale = size ? size / 40 : 1;
  return (
    <div
      className={`relative inline-flex items-center justify-center w-10 h-10 ${className}`}
      style={scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: "center center" } : undefined}
      role="status"
      aria-label="Carregando..."
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute top-0 left-[18px] w-1 h-3 rounded-full origin-[2px_20px] ${cor ? "" : "bg-zinc-800 dark:bg-white"}`}
          style={{
            rotate: i * 45,
            backgroundColor: cor,
          }}
          animate={{ scaleY: [0.5, 1.5, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};
