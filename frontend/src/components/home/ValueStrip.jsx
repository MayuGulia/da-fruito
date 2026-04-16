import React from "react";
import { Reveal } from "../Reveal";
import { Leaf, Palette, Package, Sparkles } from "lucide-react";

const PILLARS = [
  { icon: Palette, label: "Artisanal Craft", copy: "Hand-tied in our Delhi atelier." },
  { icon: Leaf, label: "All Imported Confectionery", copy: "Curated across four continents." },
  { icon: Package, label: "Premium Materials", copy: "Ceramic, silver, walnut, jute." },
  { icon: Sparkles, label: "Bespoke Orders Welcome", copy: "Composed precisely to your vision." },
];

export const ValueStrip = () => (
  <section id="value" data-testid="value-strip" className="bg-[#2A1F0F] py-14 md:py-20 border-y border-gold/15">
    <div className="lux-container grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      {PILLARS.map((p, i) => (
        <Reveal key={p.label} delay={i * 0.08}>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold/50 mb-4 group-hover:bg-gold/10 transition-all duration-500 group-hover:scale-110">
              <p.icon className="text-gold" size={22} />
            </div>
            <div className="font-display text-2xl text-antique mb-1">{p.label}</div>
            <p className="text-ivory/60 text-sm font-body italic">{p.copy}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);
export default ValueStrip;
