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
      {/* Brand cover — Da Fruito signature luxury hamper (teal + gold ribbon, marble vessel) */}
      <motion.img
        src="https://customer-assets.emergentagent.com/job_7c77ce09-816e-4aff-b4d3-e2893d5d1d92/artifacts/x5knnh47_image.png"
        alt="Da Fruito luxury hamper"
        className="absolute inset-0 w-full h-full object-cover object-right"
        style={{ y, scale: 1.05 }}
      />
      {/* Left-side dark wash so the copy sits on the atelier teal field */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0E1F1F]/90 via-[#0E1F1F]/55 to-transparent" />
      {/* Tiny top fade so navbar sits cleanly */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/70 to-transparent" />

      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 lg:px-20 max-w-[1360px] mx-auto"
      >
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, letterSpacing: "0.6em" }}
            animate={{ opacity: 1, letterSpacing: "0.42em" }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="font-ui text-[10.5px] md:text-[11.5px] text-[#D9B46A]/90 uppercase mb-7 md:mb-9"
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
              fontSize: "clamp(3rem, 7.4vw, 7rem)",
              fontWeight: 400,
            }}
          >
            The Art of Gifting,
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-5 mt-1 md:mt-2"
          >
            <span
              className="font-editorial italic text-[#D9B46A]"
              style={{
                textShadow: "0 4px 30px rgba(14, 31, 31, 0.6)",
                fontSize: "clamp(2.75rem, 6.6vw, 6.25rem)",
                letterSpacing: "0.01em",
                fontWeight: 400,
              }}
            >
              Perfected.
            </span>
            <div className="h-px w-14 md:w-20 bg-[#C4A35A]/70" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05 }}
            className="font-body text-white/95 mt-8 md:mt-10 text-lg md:text-[19px] max-w-xl leading-[1.6]"
            style={{ textShadow: "0 2px 18px rgba(14, 31, 31, 0.6)" }}
          >
            Handcrafted luxury hampers for every occasion that deserves the extraordinary.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.3 }}
            className="flex flex-col sm:flex-row gap-4 mt-10"
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
        </div>
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
