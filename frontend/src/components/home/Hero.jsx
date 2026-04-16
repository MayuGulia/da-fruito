import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const Hero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 180]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.25]);
  return (
    <section data-testid="hero-section" className="relative h-[100vh] overflow-hidden vignette">
      <motion.img
        src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=2000&q=85"
        alt="Da Fruito luxury hamper"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ y, scale: 1.12 }}
      />
      <div className="absolute inset-0 bg-obsidian/65" />
      <motion.div style={{ opacity }} className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.5em" }} animate={{ opacity: 1, letterSpacing: "0.35em" }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="font-ui text-[0.65rem] md:text-[0.75rem] text-gold uppercase mb-6"
        >
          Est. Delhi · Curated Gifting
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 50, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="font-display italic text-[11vw] md:text-[6vw] leading-[1.05] text-ivory"
        >
          The Art of Gifting,<br /><span className="text-antique">Perfected.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="font-body text-ivory/85 mt-6 md:mt-8 text-lg md:text-xl max-w-2xl"
        >
          Handcrafted luxury hampers for every occasion that deserves the extraordinary.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.2 }}
          className="flex flex-col md:flex-row gap-4 mt-10"
        >
          <a href="#collections" data-testid="hero-cta-explore" className="btn-outline-gold">Explore Collections</a>
          <Link to="/create-hamper" data-testid="hero-cta-create" className="btn-gold">Create Your Gift Hamper</Link>
        </motion.div>
      </motion.div>
      <motion.a
        href="#value" aria-label="Scroll" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-gold"
      >
        <ChevronDown size={28} />
      </motion.a>
    </section>
  );
};
export default Hero;
