import React from 'react';
import { motion } from 'motion/react';

interface SanctuaryAnimationProps {
  active: boolean;
}

/**
 * Peaceful custom SVG Synagogue sanctuary & Menorah / Ner Tamid illustration
 * with smooth compositor-only opacity/transform breathing animations when Shul Mode is active.
 */
export const SanctuaryAnimation: React.FC<SanctuaryAnimationProps> = ({ active }) => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center select-none">
      {/* Subtle Concentric Sanctuary Acoustic Ripples when Active */}
      {active && (
        <>
          <motion.div
            initial={{ scale: 0.85, opacity: 0.45 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-full border border-amber-400/40 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.85, opacity: 0.3 }}
            animate={{ scale: 1.25, opacity: 0 }}
            transition={{
              duration: 3.2,
              delay: 1.4,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-full border border-amber-300/30 pointer-events-none"
          />
        </>
      )}

      {/* Core Architectural Medallion */}
      <motion.div
        animate={{
          scale: active ? [1, 1.03, 1] : 1,
        }}
        transition={{
          duration: 4,
          repeat: active ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
          active
            ? 'bg-slate-900 text-amber-400 border border-amber-400/40 shadow-md'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
        }`}
      >
        {/* Custom Synagogue Arch & Tablets of the Covenant / Star Icon */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-11 h-11"
        >
          {/* Outer Sanctuary Dome & Pillars */}
          <path
            d="M12 52V28C12 16.9543 20.9543 8 32 8C43.0457 8 52 16.9543 52 28V52"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M8 52H56"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Inner Twin Arches (Luchot / Sanctuary Doors) */}
          <path
            d="M21 52V32C21 28.6863 23.4624 26 26.5 26C29.5376 26 32 28.6863 32 32V52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M32 52V32C32 28.6863 34.4624 26 37.5 26C40.5376 26 43 28.6863 43 32V52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Star of David / Ner Tamid Accent above Arches */}
          <path
            d="M32 13L35.2 18.5H28.8L32 13Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M32 20.5L28.8 15H35.2L32 20.5Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* Sound Wave Mute Line when Active */}
          {active && (
            <circle
              cx="32"
              cy="16.75"
              r="1.5"
              fill="currentColor"
            />
          )}
        </svg>
      </motion.div>
    </div>
  );
};
