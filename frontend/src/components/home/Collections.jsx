import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Reveal } from "../Reveal";
import { api, formatINR } from "../../lib/api";
import { useCartStore } from "../../store/cartStore";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

const OCC = [
  { slug: "anniversary",  label: "For Everlasting Bonds",  image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&q=85" },
  { slug: "birthday",     label: "The Celebration Edit",   image: "https://images.unsplash.com/photo-1464347744102-11db6282f854?w=1200&q=85" },
  { slug: "festive",      label: "The Festive Heirloom",   image: "https://images.unsplash.com/photo-1482275548304-a58859dc31b7?w=1200&q=85" },
  { slug: "corporate",    label: "The Corporate Gesture",  image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1200&q=85" },
  { slug: "wellness",     label: "The Sage Tea Ritual",    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&q=85" },
  { slug: "housewarming", label: "Housewarming Welcome",   image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=1200&q=85" },
];

export const Collections = () => {
  const [hampers, setHampers] = useState([]);
  const [active, setActive] = useState(null); // null = show tile grid; slug = show cards for that occasion
  const [open, setOpen] = useState(null);
  const addToCart = useCartStore((s) => s.add);
  const loc = useLocation();

  useEffect(() => {
    api.get("/hampers").then(({ data }) => setHampers(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const occ = params.get("occasion");
    if (occ && OCC.find(o => o.slug === occ)) setActive(occ);
  }, [loc.search]);

  const filtered = useMemo(() => active ? hampers.filter((h) => h.occasion === active) : hampers, [active, hampers]);

  return (
    <section id="collections" data-testid="collections-section" className="py-24 md:py-32 bg-[#EEF5F4]">
      <div className="lux-container">
        <Reveal>
          <div className="text-center mb-16">
            <div className="text-[11px] tracking-[0.3em] text-[#2A7E7C] uppercase font-ui mb-3">Signature Collections</div>
            <h2 className="font-display text-5xl md:text-6xl text-[#1A2E2E]">Shop by <em className="text-[#2A7E7C] italic">Collection</em></h2>
            <div className="hr-gold w-32 mx-auto mt-6" />
          </div>
        </Reveal>

        {/* TILE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {OCC.map((o, i) => (
            <motion.button
              key={o.slug}
              onClick={() => setActive(o.slug)}
              data-testid={`tile-${o.slug}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
              whileHover={{ scale: 1.03 }}
              className={`group relative aspect-square overflow-hidden rounded-lg text-left transition-all duration-300 ${active === o.slug ? "ring-[3px] ring-[#2A7E7C]/80" : ""}`}
            >
              <img src={o.image} alt={o.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E2E]/70 via-[#1A2E2E]/10 to-transparent" />
              <div className="absolute inset-0 group-hover:shadow-[inset_0_0_0_3px_rgba(42,126,124,0.7)] transition-all" />
              <span className="absolute bottom-5 left-5 font-ui text-[13px] md:text-sm font-bold text-white tracking-[0.14em] uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">{o.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Filter + product cards — revealed when a tile is active */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              <div className="flex flex-wrap gap-3 justify-center mb-10">
                <button onClick={() => setActive(null)} className="pill" data-testid="filter-clear">All Collections</button>
                {OCC.map((p) => (
                  <button key={p.slug} data-testid={`filter-${p.slug}`} onClick={() => setActive(p.slug)} className={`pill ${active === p.slug ? "pill-active" : ""}`}>{p.label}</button>
                ))}
              </div>

              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {filtered.map((h, i) => (
                    <motion.div
                      key={h.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                      className="card-lux group cursor-pointer"
                      data-testid={`hamper-card-${h.id}`}
                      onClick={() => setOpen(h)}
                    >
                      <div className="relative h-72 overflow-hidden">
                        <img alt={h.name} src={h.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E2E]/45 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 text-[10px] font-ui uppercase tracking-[0.12em] text-[#2A7E7C] bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-sm">{OCC.find(o => o.slug === h.occasion)?.label}</div>
                      </div>
                      <div className="p-6">
                        <div className="font-display text-2xl text-[#1A2E2E] group-hover:text-[#2A7E7C] transition-colors">{h.name}</div>
                        <p className="font-body text-[#3D5C5A] italic text-sm mt-1 line-clamp-2">{h.description}</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {h.materials?.slice(0, 3).map((m) => (
                            <span key={m} className="text-[10px] font-ui uppercase tracking-[0.14em] text-[#7A9E9C] border border-[#C8DEDD] px-2.5 py-1 rounded-full bg-[#FAF8F4]">{m}</span>
                          ))}
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                          <div className="font-body text-[#3D5C5A]">From <span className="font-ui font-bold text-[16px] text-[#C4A35A]">{formatINR(h.price)}</span></div>
                          <button
                            data-testid={`add-${h.id}`}
                            onClick={(e) => { e.stopPropagation(); addToCart({ kind: "hamper", reference_id: h.id, name: h.name, price: h.price, image: h.image, quantity: 1 }); toast.success(`${h.name} added to cart`); }}
                            className="btn-outline-gold !px-4 !py-2 !text-[0.68rem]"
                          >Add to Cart</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <div className="absolute inset-0 bg-[#1A2E2E]/55 backdrop-blur-md" />
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(26,46,46,0.28)] grid md:grid-cols-2"
            >
              <button data-testid="hamper-modal-close" onClick={() => setOpen(null)} className="absolute top-4 right-4 text-[#1A2E2E] z-10 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center"><X size={20} /></button>
              <img src={open.image} alt={open.name} className="w-full h-72 md:h-full object-cover" />
              <div className="p-10">
                <div className="text-[10px] font-ui tracking-[0.22em] text-[#2A7E7C] uppercase mb-2">{OCC.find(o => o.slug === open.occasion)?.label}</div>
                <h3 className="font-display text-4xl text-[#1A2E2E] mb-3">{open.name}</h3>
                <p className="font-body text-[#3D5C5A] mb-6">{open.description}</p>
                <div className="mb-6">
                  <div className="text-[10px] tracking-[0.2em] uppercase font-ui text-[#7A9E9C] mb-2">Contains</div>
                  <ul className="font-body text-[#3D5C5A] space-y-1">
                    {open.items?.map((it) => <li key={it}>— {it}</li>)}
                  </ul>
                </div>
                <div className="font-ui font-bold text-3xl text-[#C4A35A] mb-6">{formatINR(open.price)}</div>
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
