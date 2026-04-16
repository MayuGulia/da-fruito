import React from "react";
import { Reveal } from "../Reveal";

export const About = () => (
  <section id="about" data-testid="about-section" className="py-24 md:py-32 bg-walnut">
    <div className="lux-container grid md:grid-cols-[45%_55%] gap-12 md:gap-20 items-center">
      <Reveal>
        <div className="relative overflow-hidden">
          <img src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1400&q=85" alt="atelier" className="w-full h-[520px] object-cover" />
          <div className="absolute inset-0 ring-1 ring-gold/25 pointer-events-none" />
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div>
          <div className="text-[0.7rem] tracking-[0.4em] text-bronze uppercase font-ui mb-3">Our Story</div>
          <h2 className="font-display text-5xl md:text-6xl text-ivory leading-tight">Where Art Meets the <em className="italic text-antique">Gift of Giving</em></h2>
          <p className="font-body text-ivory/75 mt-6 text-lg leading-relaxed">
            Da Fruito was born in a Delhi atelier where hand-tied ribbons, ceramic vessels, and single-origin confections compose a quiet ceremony. Each hamper is a letter — a whisper of intention, unhurried, carefully made.
          </p>
          <blockquote className="mt-8 pl-6 border-l-2 border-gold font-body italic text-ivory/85 text-xl">
            Every hamper we create is a conversation between art and generosity.
          </blockquote>
          <div className="mt-8 font-script text-3xl text-antique">— The Da Fruito Atelier</div>
        </div>
      </Reveal>
    </div>
  </section>
);
export default About;
