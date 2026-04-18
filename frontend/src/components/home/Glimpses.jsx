import React from "react";
import { motion } from "framer-motion";
import { Reveal } from "../Reveal";
import { Play } from "lucide-react";

// Glimpses — 3-column grid: two editorial photos + embedded @da.fruito Instagram reel.
// Per v5.0 spec; center column is the atelier reel iframe for authenticity.
const REEL_URL = "https://www.instagram.com/reel/DLPey7GzkYH/embed/";

export const Glimpses = () => (
  <section data-testid="glimpses-section" className="bg-white py-24 md:py-32">
    <div className="lux-container">
      <Reveal>
        <div className="text-center mb-14">
          <div className="text-[0.7rem] tracking-[0.4em] text-[#2A7E7C] uppercase font-ui mb-3">Glimpses</div>
          <h2 className="font-display text-4xl md:text-6xl text-[#1A2E2E]">
            Inside the <em className="italic text-[#2A7E7C]">Atelier</em>
          </h2>
          <p className="font-body italic text-[#3D5C5A] mt-4 text-lg max-w-xl mx-auto">
            A quiet look at the hands, the ribbons, and the hampers as they leave us.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Left editorial still */}
        <motion.a
          href="https://www.instagram.com/da.fruito/"
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative group overflow-hidden rounded-sm"
          data-testid="glimpse-left"
        >
          <img
            src="https://images.unsplash.com/photo-1549488344-cbb6c34de5d7?w=1200&q=85"
            alt="Ribbon tying in the Da Fruito atelier"
            className="w-full h-[480px] md:h-[560px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E2E]/45 to-transparent" />
          <div className="absolute bottom-4 left-4 font-ui text-[10px] tracking-[0.3em] text-white/85 uppercase">Ribbon Study · N°01</div>
        </motion.a>

        {/* Center reel — @da.fruito */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-sm bg-[#1A2E2E] border border-[#C8DEDD]"
          data-testid="glimpse-reel"
        >
          <div className="relative w-full" style={{ aspectRatio: "9 / 16", minHeight: "480px" }}>
            <iframe
              title="Da Fruito Atelier Reel"
              src={REEL_URL}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              scrolling="no"
              allow="encrypted-media; autoplay; clipboard-write; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <a
            href="https://www.instagram.com/reel/DLPey7GzkYH/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3 font-ui text-[11px] tracking-[0.26em] uppercase text-[#2A7E7C] hover:text-[#1E5C5A] transition-colors border-t border-[#C8DEDD] bg-white"
            data-testid="glimpse-reel-cta"
          >
            <Play size={13} /> Watch on Instagram
          </a>
        </motion.div>

        {/* Right editorial still */}
        <motion.a
          href="https://www.instagram.com/da.fruito/"
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative group overflow-hidden rounded-sm"
          data-testid="glimpse-right"
        >
          <img
            src="https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=1200&q=85"
            alt="A finished Da Fruito hamper, ready to be delivered"
            className="w-full h-[480px] md:h-[560px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E2E]/45 to-transparent" />
          <div className="absolute bottom-4 left-4 font-ui text-[10px] tracking-[0.3em] text-white/85 uppercase">Composed · N°12</div>
        </motion.a>
      </div>
    </div>
  </section>
);

export default Glimpses;
