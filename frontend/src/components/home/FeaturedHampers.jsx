import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "../Reveal";
import { formatINR } from "../../lib/api";
import { useCartStore } from "../../store/cartStore";
import { toast } from "sonner";

// ─── Hardcoded hamper data with manual image URLs ───────────────────────────
const HAMPERS = [
  {
    id: 1,
    name: "The Everlasting Bonds",
    description: "A ceremony in a ceramic vessel. Single-origin chocolates, handpicked teas, and a personalised keepsake.",
    price: 4500,
    occasion: "Anniversary",
    image: "https://i.postimg.cc/NGxKRyfh/Gemini-Generated-Image-idxbyoidxbyoidxb.png",
  },
  {
    id: 2,
    name: "The Celebration Edit",
    description: "Playful and indulgent — truffles, shortbread, and sparkling joy in every layer.",
    price: 3200,
    occasion: "Birthday",
    image: "https://i.postimg.cc/0NdshwBX/Gemini-Generated-Image-83dgwn83dgwn83dg-(1).png",
  },
  {
    id: 3,
    name: "The Festive Heirloom",
    description: "A Diwali and winter-festive hamper — saffron, preserves, and handcrafted sweets.",
    price: 5800,
    occasion: "Festive",
    image: "https://i.postimg.cc/dt9z9YgT/Gemini-Generated-Image-gkg4t8gkg4t8gkg4.png",
  },
  {
    id: 4,
    name: "The Corporate Gesture",
    description: "Refined, restrained, memorable — for boardrooms and beyond.",
    price: 4200,
    occasion: "Corporate",
    image: "https://i.postimg.cc/mgLJh5px/Gemini-Generated-Image-gxvfk1gxvfk1gxvf.png",
  },
  {
    id: 5,
    name: "The Sage Tea Ritual",
    description: "A slow morning — loose-leaf tea, acacia honey, and handmade ceramics.",
    price: 2800,
    occasion: "Wellness",
    image: "https://i.postimg.cc/L5z44bCz/Gemini-Generated-Image-biua7xbiua7xbiua.png",
  },
  {
    id: 6,
    name: "The Housewarming Welcome",
    description: "A new home deserves a warm beginning — preserves, candles, and curated kitchen luxuries.",
    price: 3400,
    occasion: "Housewarming",
    image: "https://i.postimg.cc/NfmbYkgg/Gemini-Generated-Image-xq072exq072exq07.png",
  },
];
// ─────────────────────────────────────────────────────────────────────────────

// Horizontal-scroll Featured Hampers row — Code-Silver "bestsellers" style
export const FeaturedHampers = () => {
  const [items] = useState(HAMPERS);
  const addToCart = useCartStore((s) => s.add);
  const scroller = useRef(null);

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
