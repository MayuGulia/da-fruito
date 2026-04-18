import React from "react";
import { Reveal } from "../Reveal";

// Press/media logo strip — wordmarks styled in Cormorant Garamond italic since we don't
// have actual logo files. Grayscale default, full color on hover. Marquee loop.
const LOGOS = [
  "Vogue India",
  "Condé Nast Traveller",
  "Lifestyle Asia",
  "Times Now",
  "Mid-Day",
  "Travel + Leisure",
  "Delhi Times",
];

export const AsSeenIn = () => {
  const strip = [...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <section data-testid="as-seen-in" className="bg-white py-14 border-y border-[#C8DEDD]/60">
      <Reveal>
        <div className="text-center mb-8">
          <div className="font-ui text-[13px] tracking-[0.3em] text-[#2A7E7C] uppercase">As Seen In</div>
        </div>
      </Reveal>
      <div className="relative overflow-hidden">
        <div className="flex gap-14 w-[300%] marquee-track items-center" style={{ animationDuration: "35s" }}>
          {strip.map((name, i) => (
            <div
              key={i}
              className="font-display italic text-2xl md:text-3xl text-[#7A9E9C] whitespace-nowrap opacity-80 hover:text-[#1A2E2E] hover:opacity-100 transition-all duration-500"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default AsSeenIn;
