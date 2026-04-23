import React from "react";
import { motion } from "framer-motion";
import { Reveal } from "../Reveal";
import { Instagram } from "lucide-react";

// 4x2 Shop-on-Instagram grid — per v5.0 spec.
// Each tile has a teal-wash hover + Instagram icon overlay, linking to @da.fruito.
const IG_HANDLE_URL = "https://www.instagram.com/da.fruito/";
const TILES = [
  { src: "https://i.postimg.cc/8P83XyHD/Gemini-Generated-Image-4ehcqp4ehcqp4ehc.png", cap: "Festive No.7"  },
  { src: "https://i.postimg.cc/bYFYGjpH/Gemini-Generated-Image-h9otuvh9otuvh9ot.png", cap: "Ribbon Study"  },
  { src: "https://i.postimg.cc/9XvdGKBC/Gemini-Generated-Image-o54ifbo54ifbo54i.png", cap: "Celebration"    },
  { src: "https://i.postimg.cc/W4hccdJv/Gemini-Generated-Image-xq072exq072exq07.png", cap: "The Edit"       },
  { src: "https://i.postimg.cc/L5z44bCz/Gemini-Generated-Image-biua7xbiua7xbiua.png", cap: "Sage Ritual"    },
  { src: "https://i.postimg.cc/dt9z9YgT/Gemini-Generated-Image-gkg4t8gkg4t8gkg4.png", cap: "Atelier"        },
  { src: "https://i.postimg.cc/NfmbYkgg/Gemini-Generated-Image-xq072exq072exq07.png", cap: "Heirloom"       },
  { src: "https://i.postimg.cc/mgLJh5px/Gemini-Generated-Image-gxvfk1gxvfk1gxvf.png", cap: "Corporate"      },
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
            href={<div>https://www.instagram.com/da.fruito/</div>}
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
              src = {t.src}
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
