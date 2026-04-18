import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";

const QUOTES = [
  { text: "Da Fruito arrived at our anniversary like a chapter from a novel — slow, considered, and utterly luxurious.", name: "Aditi & Rohan Malhotra", occasion: "Anniversary Gift" },
  { text: "I sent five hampers to our board; every single one remarked on the silver tray. Quiet, confident taste.", name: "Karan Sethi", occasion: "Corporate Gesture" },
  { text: "The bespoke builder felt like couture. Watching my hamper compose itself was pure theatre.", name: "Meher Kapoor", occasion: "Bespoke Commission" },
];

export const Testimonials = () => {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((v) => (v + 1) % QUOTES.length), 6000); return () => clearInterval(t); }, []);
  const q = QUOTES[i];
  return (
    <section data-testid="testimonials-section" className="py-24 md:py-32 bg-[#EEF5F4]">
      <div className="lux-container text-center max-w-3xl">
        <div className="flex justify-center gap-1 mb-6">
          {[...Array(5)].map((_, k) => <Star key={k} size={14} className="fill-[#2A7E7C] text-[#2A7E7C]" />)}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
          >
            <blockquote className="font-body italic text-2xl md:text-3xl text-[#1A2E2E] leading-relaxed">"{q.text}"</blockquote>
            <div className="mt-8 font-ui uppercase tracking-[0.3em] text-[0.72rem] text-[#2A7E7C]">{q.name}</div>
            <div className="mt-1 italic font-body text-[#7A9E9C]">{q.occasion}</div>
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-center gap-2 mt-10">
          {QUOTES.map((_, k) => (
            <button key={k} onClick={() => setI(k)} className={`h-2 rounded-full transition-all ${k === i ? "bg-[#2A7E7C] w-8" : "bg-[#C8DEDD] w-2"}`} aria-label={`quote ${k + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
};
export default Testimonials;
