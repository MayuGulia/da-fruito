import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const letters = "Da Fruito".split("");

export const Preloader = ({ onDone }) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2200);
    const t4 = setTimeout(() => onDone && onDone(), 2900);
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
      <div className="relative flex flex-col items-center">
        {/* ribbon arc */}
        <motion.svg width="280" height="160" viewBox="0 0 280 160" className="mb-6">
          <motion.path
            d="M 20 120 Q 140 20 260 120"
            stroke="#2A7E7C" strokeWidth="1.4" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.path
            d="M 120 90 Q 140 60 160 90 Q 150 110 140 100 Q 130 110 120 90 Z"
            fill="#E6F4F3" stroke="#2A7E7C" strokeWidth="0.8"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.6, y: phase >= 1 ? 0 : 20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "140px 90px" }}
          />
          <motion.circle
            cx="140" cy="100" r="3" fill="#2A7E7C"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }}
          />
        </motion.svg>

        <div className="flex" aria-label="Da Fruito">
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              className="font-display text-4xl md:text-6xl"
              style={{ color: "#1A2E2E" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 12 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {ch === " " ? "\u00A0" : ch}
            </motion.span>
          ))}
        </div>

        <motion.p
          className="mt-6 text-xs tracking-[0.4em] uppercase font-ui"
          style={{ color: "#2A7E7C" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          Curated for those who give extraordinarily
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
