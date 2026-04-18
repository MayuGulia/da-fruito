import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Reveal } from "../Reveal";
import { api, formatINR } from "../../lib/api";
import { useCartStore } from "../../store/cartStore";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

const OCC_LABEL = {
  all: "All Collections",
  anniversary: "For Everlasting Bonds",
  birthday: "The Celebration Edit",
  festive: "The Festive Heirloom",
  corporate: "The Corporate Gesture",
  wellness: "The Sage Tea Ritual",
  housewarming: "Housewarming Welcome",
};

export const Collections = () => {
  const [hampers, setHampers] = useState([]);
  const [active, setActive] = useState("all");
  const [open, setOpen] = useState(null);
  const addToCart = useCartStore((s) => s.add);
  const loc = useLocation();

  useEffect(() => {
    api.get("/hampers").then(({ data }) => setHampers(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const occ = params.get("occasion");
    if (occ && OCC_LABEL[occ]) setActive(occ);
  }, [loc.search]);

  const filtered = useMemo(() => active === "all" ? hampers : hampers.filter((h) => h.occasion === active), [active, hampers]);

  const pills = ["all", "anniversary", "birthday", "festive", "corporate", "wellness", "housewarming"];

  return (
    <section id="collections" data-testid="collections-section" className="py-24 md:py-32 relative overflow-hidden bg-white">
      <div className="lux-container">
        <Reveal>
          <div className="text-center mb-16">
            <div className="text-[0.7rem] tracking-[0.4em] text-[#B07D62] uppercase font-ui mb-3">Signature Hampers</div>
            <h2 className="font-display text-5xl md:text-7xl text-[#2D2420]">Our Signature <em className="text-[#B07D62] italic">Collections</em></h2>
            <div className="hr-gold w-32 mx-auto mt-6" />
          </div>
        </Reveal>

        <Reveal>
          <div className="flex flex-wrap gap-3 justify-center mb-14 overflow-x-auto scrollbar-none">
            {pills.map((p) => (
              <button key={p} data-testid={`filter-${p}`} onClick={() => setActive(p)} className={`pill ${active === p ? "pill-active" : ""}`}>{OCC_LABEL[p]}</button>
            ))}
          </div>
        </Reveal>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((h, i) => (
              <motion.div
                key={h.id}
                layout
                initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22,1,0.36,1], delay: i * 0.06 }}
                className="card-lux group cursor-pointer"
                data-testid={`hamper-card-${h.id}`}
                onClick={() => setOpen(h)}
              >
                <div className="relative h-72 overflow-hidden">
                  <img alt={h.name} src={h.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2D2420]/40 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 text-[0.6rem] italic font-body text-[#B07D62] bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-sm">{OCC_LABEL[h.occasion]}</div>
                </div>
                <div className="p-6">
                  <div className="font-display text-2xl text-[#2D2420] group-hover:text-[#B07D62] transition-colors">{h.name}</div>
                  <p className="font-body text-[#5C4A3A] italic text-sm mt-1 line-clamp-2">{h.description}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {h.materials?.slice(0, 3).map((m) => (
                      <span key={m} className="text-[0.6rem] font-ui uppercase tracking-[0.2em] text-[#9C8878] border border-[#E0D4C8] px-2.5 py-1 rounded-full bg-[#F5EFE6]">{m}</span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="font-body text-[#5C4A3A]">From <span className="font-display text-2xl text-[#B07D62]">{formatINR(h.price)}</span></div>
                    <button
                      data-testid={`add-${h.id}`}
                      onClick={(e) => { e.stopPropagation(); addToCart({ kind: "hamper", reference_id: h.id, name: h.name, price: h.price, image: h.image, quantity: 1 }); toast.success(`${h.name} added to your cart`); }}
                      className="btn-outline-gold !px-4 !py-2 !text-[0.68rem]"
                    >Add to Cart</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            data-testid="hamper-modal"
          >
            <div className="absolute inset-0 bg-[#2D2420]/50 backdrop-blur-md" />
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(45,36,32,0.25)] grid md:grid-cols-2"
            >
              <button data-testid="hamper-modal-close" onClick={() => setOpen(null)} className="absolute top-4 right-4 text-[#2D2420] z-10 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center"><X size={20} /></button>
              <img src={open.image} alt={open.name} className="w-full h-72 md:h-full object-cover" />
              <div className="p-10">
                <div className="text-[0.65rem] tracking-[0.35em] text-[#B07D62] italic uppercase mb-2">{OCC_LABEL[open.occasion]}</div>
                <h3 className="font-display text-4xl text-[#2D2420] mb-3">{open.name}</h3>
                <p className="font-body text-[#5C4A3A] mb-6">{open.description}</p>
                <div className="mb-6">
                  <div className="text-[0.65rem] tracking-[0.3em] uppercase font-ui text-[#9C8878] mb-2">Contains</div>
                  <ul className="font-body text-[#5C4A3A] space-y-1">
                    {open.items?.map((it) => <li key={it}>— {it}</li>)}
                  </ul>
                </div>
                <div className="font-display text-3xl text-[#B07D62] mb-6">{formatINR(open.price)}</div>
                <button onClick={() => { addToCart({ kind: "hamper", reference_id: open.id, name: open.name, price: open.price, image: open.image, quantity: 1 }); toast.success("Added to cart"); setOpen(null); }} className="btn-gold w-full" data-testid="hamper-modal-add">Add to Cart</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
export default Collections;
