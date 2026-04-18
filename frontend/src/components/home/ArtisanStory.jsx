import React from "react";
import { motion } from "framer-motion";
import { Reveal } from "../Reveal";

// ArtisanStory — dark split section (per v5.0 spec, bg #1A2E2E)
// Left: editorial image, Right: heritage copy + signature
export const ArtisanStory = () => (
  <section data-testid="artisan-story" className="bg-[#1A2E2E] text-white py-24 md:py-32 relative overflow-hidden">
    {/* subtle teal radial glow */}
    <div
      className="absolute inset-0 pointer-events-none opacity-70"
      style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(42,126,124,0.18), transparent 55%)" }}
    />
    <div className="lux-container relative grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
      <Reveal>
        <div className="relative overflow-hidden rounded-sm">
          <img
            src="https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=1400&q=85"
            alt="Da Fruito atelier — hands arranging a hamper"
            className="w-full h-[520px] md:h-[620px] object-cover"
          />
          <div className="absolute inset-0 ring-1 ring-[#2A7E7C]/40 rounded-sm pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-4 right-4 hidden md:block"
          >
            <div className="bg-[#1A2E2E]/95 border border-[#2A7E7C]/60 px-5 py-3 rounded-sm backdrop-blur-sm">
              <div className="font-ui text-[0.58rem] tracking-[0.4em] text-[#2A7E7C] uppercase">Est.</div>
              <div className="font-display text-2xl text-white leading-none mt-1">MMXXIV</div>
              <div className="font-ui text-[0.58rem] tracking-[0.35em] text-[#7A9E9C] uppercase mt-1">Delhi · India</div>
            </div>
          </motion.div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="max-w-lg">
          <div className="text-[0.68rem] tracking-[0.4em] text-[#2A7E7C] uppercase font-ui mb-5">The Artisan Story</div>
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05]">
            A Quiet Atelier,<br />
            <em className="italic text-[#C4A35A]">Unhurried Craft.</em>
          </h2>
          <div className="h-px w-16 bg-[#2A7E7C] my-8" />
          <p className="font-body text-white/80 text-lg leading-[1.75]">
            Da Fruito began where most luxury brands end — at the margins of haste. In a Delhi atelier,
            our artisans still measure in thread, in grain, in the patient turn of a ceramic wheel.
            Every hamper is a composition: a pairing of ingredients considered for their provenance,
            textures chosen for their hush, ribbons tied by a single pair of hands.
          </p>
          <p className="font-body italic text-white/65 mt-6 text-lg leading-[1.75]">
            We do not make gifts. We compose them. One guest. One occasion. One ceremony at a time.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <div className="h-px w-10 bg-[#C4A35A]/60" />
            <span className="font-script text-3xl text-[#C4A35A]">— The Da Fruito Atelier</span>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

export default ArtisanStory;
