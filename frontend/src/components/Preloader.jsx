import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const letters = "Da Fruito".split("");

export const Preloader = ({ onDone }) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);   // logo arc draws
    const t2 = setTimeout(() => setPhase(2), 1200);  // wordmark reveals
    const t3 = setTimeout(() => setPhase(3), 2000);  // tagline reveals
    const t4 = setTimeout(() => onDone && onDone(), 2800);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  return (
    <motion.div
      data-testid="preloader"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "#FFFFFF" }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative flex flex-col items-center px-6">
        {/* Da Fruito brand logo — scaled up preloader variant */}
        <motion.svg
          width="150"
          height="90"
          viewBox="0 0 40 24"
          className="mb-6"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Outer arc — the "Da Fruito" signature curve */}
          <motion.path
            d="M 4 18 Q 20 2 36 18"
            stroke="#2A7E7C"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Centered leaf/fruit motif */}
          <motion.path
            d="M 15 13 Q 20 8 25 13 Q 22 17 20 15 Q 18 17 15 13 Z"
            fill="#E6F4F3"
            stroke="#2A7E7C"
            strokeWidth="0.6"
            initial={{ opacity: 0, scale: 0.5, y: 3 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.5, y: phase >= 1 ? 0 : 3 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "20px 13px" }}
          />
          {/* Pulse dot */}
          <motion.circle
            cx="20"
            cy="14"
            r="0.7"
            fill="#2A7E7C"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </motion.svg>

        {/* Wordmark */}
        <div className="flex" aria-label="Da Fruito">
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              className="font-display text-5xl md:text-7xl tracking-wide"
              style={{ color: "#1A2E2E" }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 14 }}
              transition={{ duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {ch === " " ? "\u00A0" : ch}
            </motion.span>
          ))}
        </div>

        {/* Hairline divider + tagline */}
        <motion.div
          className="h-px w-16 bg-[#2A7E7C]/60 mt-7"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.p
          className="mt-5 text-[10px] md:text-xs tracking-[0.45em] uppercase font-ui text-center"
          style={{ color: "#2A7E7C" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          data-testid="preloader-tagline"
        >
          The Art of Gifting, Perfected.
        </motion.p>
      </div>
    </motion.div>
  );
};

export const PreloaderGate = ({ children }) => {
  const [shown, setShown] = useState(() => !sessionStorage.getItem("dafruito_preload"));
  const finish = () => { sessionStorage.setItem("dafruito_preload", "1"); setShown(false); };
  return (
    <>
      <AnimatePresence>{shown && <Preloader key="preloader" onDone={finish} />}</AnimatePresence>
      {children}
    </>
  );
};

export default Preloader;
