import React from "react";
import { Reveal } from "../Reveal";

export const About = () => (
  <section id="about" data-testid="about-section" className="py-24 md:py-32 bg-[#EEF5F4]">
    <div className="lux-container grid md:grid-cols-[45%_55%] gap-12 md:gap-20 items-center">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl">
          <img src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1400&q=85" alt="atelier" className="w-full h-[520px] object-cover" />
          <div className="absolute inset-0 ring-1 ring-[#C8DEDD] rounded-2xl pointer-events-none" />
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div>
          <div className="text-[0.7rem] tracking-[0.4em] text-[#2A7E7C] uppercase font-ui mb-3">Our Story</div>
          <h2 className="font-display text-5xl md:text-6xl text-[#1A2E2E] leading-tight">Where Art Meets the <em className="italic text-[#2A7E7C]">Gift of Giving</em></h2>
          <p className="font-body text-[#3D5C5A] mt-6 text-lg leading-relaxed">
            Da Fruito was born in a Delhi atelier where hand-tied ribbons, ceramic vessels, and single-origin confections compose a quiet ceremony. Each hamper is a letter — a whisper of intention, unhurried, carefully made.
          </p>
          <blockquote className="mt-8 pl-6 border-l-2 border-[#2A7E7C] font-body italic text-[#1A2E2E] text-xl">
            Every hamper we create is a conversation between art and generosity.
          </blockquote>
          <div className="mt-8 font-script text-3xl text-[#2A7E7C]">— The Da Fruito Atelier</div>
        </div>
      </Reveal>
    </div>
  </section>
);
export default About;
