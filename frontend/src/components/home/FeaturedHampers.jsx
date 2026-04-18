import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "../Reveal";
import { api, formatINR } from "../../lib/api";
import { useCartStore } from "../../store/cartStore";
import { toast } from "sonner";

// Horizontal-scroll Featured Hampers row — Code-Silver "bestsellers" style
export const FeaturedHampers = () => {
  const [items, setItems] = useState([]);
  const addToCart = useCartStore((s) => s.add);
  const scroller = useRef(null);

  useEffect(() => {
    api.get("/hampers").then(({ data }) => setItems(data.slice(0, 6))).catch(() => {});
  }, []);

  const scroll = (dir) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <section data-testid="featured-hampers" className="bg-white py-20 md:py-28">
      <div className="lux-container">
        <Reveal>
          <div className="flex items-end justify-between mb-10 gap-6">
            <div>
              <div className="text-[11px] tracking-[0.3em] text-[#2A7E7C] uppercase font-ui mb-2">Featured Hampers</div>
              <h2 className="font-display text-4xl md:text-5xl text-[#1A2E2E]">Our Most <em className="text-[#2A7E7C] italic">Loved Gifts</em></h2>
            </div>
            <div className="hidden md:flex gap-3">
              <button onClick={() => scroll(-1)} aria-label="prev" data-testid="featured-prev" className="w-11 h-11 rounded-full bg-white border border-[#C8DEDD] text-[#2A7E7C] hover:bg-[#2A7E7C] hover:text-white transition-all flex items-center justify-center"><ChevronLeft size={18}/></button>
              <button onClick={() => scroll(1)} aria-label="next" data-testid="featured-next" className="w-11 h-11 rounded-full bg-white border border-[#C8DEDD] text-[#2A7E7C] hover:bg-[#2A7E7C] hover:text-white transition-all flex items-center justify-center"><ChevronRight size={18}/></button>
            </div>
          </div>
        </Reveal>

        <div ref={scroller} className="flex gap-6 overflow-x-auto scrollbar-none snap-x pb-4 -mx-2 px-2">
          {items.map((h) => (
            <motion.div
              key={h.id}
              whileHover={{ y: -4 }}
              className="shrink-0 snap-start w-[280px] md:w-[320px] bg-white border border-[#C8DEDD] rounded-xl overflow-hidden hover:shadow-[0_8px_28px_rgba(42,126,124,0.15)] transition-all duration-500"
              data-testid={`featured-card-${h.id}`}
            >
              <div className="relative" style={{ aspectRatio: "4/5" }}>
                <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-[#2A7E7C] text-white text-[10px] font-ui uppercase tracking-[0.14em] px-3 py-1 rounded-full">{h.occasion}</div>
              </div>
              <div className="p-5">
                <div className="font-display text-xl text-[#1A2E2E]">{h.name}</div>
                <p className="font-body italic text-[13px] text-[#7A9E9C] mt-1 line-clamp-1">{h.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="font-body text-[#3D5C5A] text-sm">From <span className="font-ui font-bold text-[15px] text-[#C4A35A]">{formatINR(h.price)}</span></div>
                  <button
                    onClick={() => { addToCart({ kind: "hamper", reference_id: h.id, name: h.name, price: h.price, image: h.image, quantity: 1 }); toast.success(`${h.name} added`); }}
                    className="btn-gold !px-4 !py-2 !text-[10px]"
                    data-testid={`featured-add-${h.id}`}
                  >Add to Cart</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#collections" className="btn-outline-gold" data-testid="see-all-hampers">See All Hampers</a>
        </div>
      </div>
    </section>
  );
};
export default FeaturedHampers;
