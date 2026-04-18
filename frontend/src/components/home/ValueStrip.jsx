import React from "react";
import { motion } from "framer-motion";
import { Reveal } from "../Reveal";

// Circular teal trust badges per v5 spec
const BADGES = [
  {
    label: "Handcrafted in Delhi",
    sub: "Every hamper, hand-tied",
    svg: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M4 14 Q12 4 20 14" strokeLinecap="round" />
        <path d="M9 11 Q12 7 15 11 Q13 15 12 13 Q11 15 9 11 Z" fill="currentColor" fillOpacity=".15" />
      </svg>
    ),
  },
  {
    label: "All Imported Confections",
    sub: "Curated from 4 continents",
    svg: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3 a13 13 0 0 1 0 18 M12 3 a13 13 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    label: "Premium Materials",
    sub: "Ceramic, silver, jute, marble",
    svg: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 3 L21 9 L12 21 L3 9 Z" strokeLinejoin="round" />
        <path d="M3 9 L21 9 M9 3 L7 9 L12 21 M15 3 L17 9 L12 21" />
      </svg>
    ),
  },
  {
    label: "Secure & Bespoke",
    sub: "Composed for your vision",
    svg: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export const ValueStrip = () => (
  <section id="value" data-testid="value-strip" className="bg-[#FAF8F4] py-16 md:py-24 border-y border-[#C8DEDD]">
    <div className="lux-container grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14">
      {BADGES.map((b, i) => (
        <Reveal key={b.label} delay={i * 0.08}>
          <motion.div
            className="text-center"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-[1.5px] border-[#2A7E7C] text-[#2A7E7C] bg-white mb-4 transition-all duration-500 hover:bg-[#E6F4F3] hover:shadow-[0_6px_18px_rgba(42,126,124,0.15)]">
              {b.svg}
            </div>
            <div className="font-ui text-[12px] font-bold tracking-[0.1em] uppercase text-[#1A2E2E]">{b.label}</div>
            <p className="text-[#7A9E9C] text-[11px] font-body italic mt-1">{b.sub}</p>
          </motion.div>
        </Reveal>
      ))}
    </div>
  </section>
);
export default ValueStrip;
