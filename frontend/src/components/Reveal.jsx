import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// Section reveal wrapper — fade-up + blur-in (NO shimmer).
export const Reveal = ({ children, delay = 0, className = "", as: As = "div" }) => {
  const reduced = useReducedMotion();
  const Comp = motion[As] || motion.div;
  return (
    <Comp
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 32, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </Comp>
  );
};

export default Reveal;
