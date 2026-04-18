import React from "react";
import { Reveal } from "../Reveal";
import { Instagram } from "lucide-react";

const IMGS = [
  "https://images.unsplash.com/photo-1608142737432-b0a0bed6fdee?w=900&q=80",
  "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=900&q=80",
  "https://images.unsplash.com/photo-1576920060091-40207b3c3d74?w=900&q=80",
  "https://images.unsplash.com/photo-1732928729959-2e8fdb5a5cd7?w=900&q=80",
  "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=900&q=80",
  "https://images.unsplash.com/photo-1549488344-cbb6c34de5d7?w=900&q=80",
];
const STRIP = [...IMGS, ...IMGS];

export const InstagramStrip = () => (
  <section data-testid="instagram-strip" className="py-20 overflow-hidden bg-white">
    <Reveal>
      <div className="text-center mb-10">
        <div className="text-[0.7rem] tracking-[0.4em] text-[#B07D62] uppercase font-ui mb-3">The Atelier</div>
        <h2 className="font-display text-4xl md:text-6xl text-[#2D2420]">The Art, As It <em className="text-[#B07D62] italic">Leaves Our Hands</em></h2>
      </div>
    </Reveal>
    <div className="relative w-full overflow-hidden">
      <div className="flex gap-4 w-[200%] animate-marquee" style={{ willChange: "transform" }}>
        {STRIP.map((src, i) => (
          <a key={i} href="https://instagram.com" target="_blank" rel="noreferrer" className="relative shrink-0 w-60 h-60 overflow-hidden group rounded-2xl">
            <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 ring-1 ring-[#E0D4C8] rounded-2xl" />
            <div className="absolute inset-0 bg-[#FDFAF6]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
              <Instagram className="text-[#B07D62]" size={28} />
            </div>
          </a>
        ))}
      </div>
    </div>
    <div className="text-center mt-10">
      <a href="https://instagram.com" target="_blank" rel="noreferrer" className="btn-outline-gold">Follow on Instagram</a>
    </div>
  </section>
);
export default InstagramStrip;
