import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Reveal } from "../Reveal";

const MATERIALS = [
  { name: "Hand-Turned Ceramic", descriptor: "Ivory-glazed, gold-rimmed.", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80" },
  { name: "Reclaimed Walnut", descriptor: "Beeswax finish, heirloom grain.", image: "https://images.unsplash.com/photo-1544776193-52d4c5b3f540?w=1200&q=80" },
  { name: "German Silver", descriptor: "Hand-hammered, warm patina.", image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=1200&q=80" },
  { name: "Hand-Woven Jute", descriptor: "Natural, textural, earthen.", image: "https://images.unsplash.com/photo-1609078147794-42d4e43d2c70?w=1200&q=80" },
  { name: "Makrana Marble", descriptor: "Cool, veined, substantial.", image: "https://images.unsplash.com/photo-1594736797933-d0801ba2fe65?w=1200&q=80" },
  { name: "Mango Wood", descriptor: "Sun-bleached, oil-finished.", image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=1200&q=80" },
];

export const Materials = () => {
  const scrollRef = useRef(null);
  return (
    <section data-testid="materials-section" className="relative py-24 md:py-32 overflow-hidden bg-[#EEF5F4]">
      {/* gold particles (no shimmer - slow float) */}
      {[...Array(18)].map((_, i) => (
        <span key={i} className="gold-particle animate-float-up"
          style={{ left: `${(i * 5.5) % 100}%`, bottom: "0", animationDelay: `${i * 0.4}s`, animationDuration: `${5 + (i % 4)}s` }} />
      ))}
      <div className="lux-container relative z-10">
        <Reveal>
          <div className="text-center mb-16">
            <div className="text-[0.7rem] tracking-[0.4em] text-[#2A7E7C] uppercase font-ui mb-3">Craft & Material</div>
            <h2 className="font-display text-5xl md:text-7xl text-[#1A2E2E]">Crafted from the <em className="text-[#2A7E7C] italic">Finest</em></h2>
          </div>
        </Reveal>
      </div>
      <motion.div
        ref={scrollRef}
        drag="x"
        dragConstraints={{ left: -1600, right: 0 }}
        className="flex gap-8 px-6 md:px-12 lg:px-24 pb-10 cursor-grab active:cursor-grabbing"
      >
        {MATERIALS.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease: [0.22,1,0.36,1], delay: i * 0.08 }}
            className="shrink-0 w-[320px] md:w-[380px] card-lux"
          >
            <div className="relative h-72 overflow-hidden">
              <img src={m.image} alt={m.name} className="w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
            </div>
            <div className="p-6">
              <div className="font-display text-2xl text-[#1A2E2E]">{m.name}</div>
              <p className="font-body italic text-[#3D5C5A] mt-1">{m.descriptor}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <div className="text-center mt-6 text-[0.7rem] tracking-[0.35em] text-[#7A9E9C] uppercase font-ui">Drag to Explore</div>
    </section>
  );
};
export default Materials;
