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
  <section id="value" data-testid="value-strip" className="bg-[#F5EFE6] py-16 md:py-24 border-y border-[#E0D4C8]">
    <div className="lux-container grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      {PILLARS.map((p, i) => (
        <Reveal key={p.label} delay={i * 0.08}>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-[#E0D4C8] mb-5 group-hover:border-[#B07D62] group-hover:bg-[#E8CFC4]/40 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_6px_20px_rgba(176,125,98,0.15)]">
              <p.icon className="text-[#B07D62]" size={22} />
            </div>
            <div className="font-display text-2xl text-[#2D2420] mb-1">{p.label}</div>
            <p className="text-[#5C4A3A] text-sm font-body italic">{p.copy}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);
export default ValueStrip;
