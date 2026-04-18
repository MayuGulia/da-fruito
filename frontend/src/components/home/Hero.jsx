import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const Hero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 180]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.25]);
  return (
    <section data-testid="hero-section" className="relative h-[100vh] overflow-hidden">
      {/* Refined editorial cover — muted, cinematic, luxury gifting still-life */}
      <motion.img
        src="https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=2400&q=90"
        alt="Da Fruito luxury hamper"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ y, scale: 1.1 }}
      />
      {/* Primary dark gradient — strong bottom-up for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0E1F1F]/95 via-[#1A2E2E]/60 to-[#1A2E2E]/35" />
      {/* Secondary teal wash for brand warmth */}
      <div className="absolute inset-0 bg-[#1A2E2E]/15" />
      {/* Soft top fade so navbar sits cleanly on image */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/80 to-transparent" />

      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 max-w-6xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.42em" }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="font-ui text-[10.5px] md:text-[11.5px] text-white/90 uppercase mb-8 md:mb-10"
        >
          Est. Delhi · Curated Gifting
        </motion.div>

        {/* Headline — Italiana for Vogue-style editorial refinement */}
        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          className="font-editorial text-white leading-[1.02]"
          style={{
            textShadow: "0 4px 40px rgba(14, 31, 31, 0.55), 0 1px 2px rgba(0,0,0,0.35)",
            fontSize: "clamp(3.25rem, 8.2vw, 8rem)",
            fontWeight: 400,
          }}
        >
          The Art of Gifting,
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center gap-5 mt-2 md:mt-3"
        >
          <div className="h-px w-10 md:w-16 bg-[#C4A35A]/70" />
          <span
            className="font-editorial italic text-[#D9B46A]"
            style={{
              textShadow: "0 4px 30px rgba(14, 31, 31, 0.6)",
              fontSize: "clamp(3rem, 7.4vw, 7.25rem)",
              letterSpacing: "0.01em",
              fontWeight: 400,
            }}
          >
            Perfected.
          </span>
          <div className="h-px w-10 md:w-16 bg-[#C4A35A]/70" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.05 }}
          className="font-body text-white/95 mt-10 md:mt-12 text-lg md:text-[19px] max-w-xl leading-[1.6]"
          style={{ textShadow: "0 2px 18px rgba(14, 31, 31, 0.6)" }}
        >
          Handcrafted luxury hampers for every occasion that deserves the extraordinary.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.3 }}
          className="flex flex-col sm:flex-row gap-4 mt-12"
        >
          <a
            href="#collections"
            data-testid="hero-cta-explore"
            className="inline-flex items-center justify-center gap-2 font-ui font-bold text-[12px] tracking-[0.18em] uppercase text-white bg-transparent border-[1.5px] border-white/90 px-10 py-4 rounded-full transition-all duration-500 hover:bg-white hover:text-[#1A2E2E] hover:scale-[1.02]"
          >
            Explore Collections
          </a>
          <Link
            to="/create-hamper"
            data-testid="hero-cta-create"
            className="btn-gold animate-teal-glow !px-10 !py-4 !text-[12px] !tracking-[0.18em]"
          >
            Create Your Gift Hamper
          </Link>
        </motion.div>
      </motion.div>

      <motion.a
        href="#value"
        aria-label="Scroll"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/80"
      >
        <ChevronDown size={26} strokeWidth={1.5} />
      </motion.a>
    </section>
  );
};

export default Hero;
