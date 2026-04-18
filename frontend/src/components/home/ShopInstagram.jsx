import React from "react";
import { motion } from "framer-motion";
import { Reveal } from "../Reveal";
import { Instagram } from "lucide-react";

// 4x2 Shop-on-Instagram grid — per v5.0 spec.
// Each tile has a teal-wash hover + Instagram icon overlay, linking to @da.fruito.
const IG_HANDLE_URL = "https://www.instagram.com/da.fruito/";
const TILES = [
  { src: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=900&q=85", cap: "Festive No.7"  },
  { src: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=900&q=85", cap: "Ribbon Study"  },
  { src: "https://images.unsplash.com/photo-1464347744102-11db6282f854?w=900&q=85", cap: "Celebration"    },
  { src: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900&q=85", cap: "The Edit"       },
  { src: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=900&q=85", cap: "Sage Ritual"    },
  { src: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900&q=85", cap: "Atelier"        },
  { src: "https://images.unsplash.com/photo-1482275548304-a58859dc31b7?w=900&q=85", cap: "Heirloom"       },
  { src: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=900&q=85", cap: "Corporate"      },
];

export const ShopInstagram = () => (
  <section data-testid="shop-instagram" className="bg-[#EEF5F4] py-24 md:py-32">
    <div className="lux-container">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div>
            <div className="text-[0.7rem] tracking-[0.4em] text-[#2A7E7C] uppercase font-ui mb-3">Shop on Instagram</div>
            <h2 className="font-display text-4xl md:text-5xl text-[#1A2E2E]">
              Follow <em className="italic text-[#2A7E7C]">@da.fruito</em>
            </h2>
            <p className="font-body italic text-[#3D5C5A] mt-3">Tap any frame to shop the story on Instagram.</p>
          </div>
          <a
            href={IG_HANDLE_URL}
            target="_blank"
            rel="noreferrer"
            data-testid="ig-follow-cta"
            className="btn-outline-gold self-start md:self-auto"
          >
            <Instagram size={16} /> Follow on Instagram
          </a>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {TILES.map((t, i) => (
          <motion.a
            key={i}
            href={IG_HANDLE_URL}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="relative group block aspect-square overflow-hidden rounded-sm"
            data-testid={`ig-tile-${i}`}
          >
            <img
              src={t.src}
              alt={t.cap}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            {/* Teal wash on hover */}
            <div className="absolute inset-0 bg-[#2A7E7C]/0 group-hover:bg-[#2A7E7C]/70 transition-colors duration-500" />
            {/* Centered Instagram icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Instagram className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]" size={28} strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-3 left-3 right-3 font-ui text-[10px] tracking-[0.24em] text-white/85 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {t.cap}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default ShopInstagram;
