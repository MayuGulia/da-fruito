import React from "react";
import { Link } from "react-router-dom";
import { Instagram, MessageCircle, Mail } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const COLLECTIONS = [
  { label: "For Everlasting Bonds", slug: "anniversary" },
  { label: "The Celebration Edit", slug: "birthday" },
  { label: "The Festive Heirloom", slug: "festive" },
  { label: "The Corporate Gesture", slug: "corporate" },
  { label: "The Sage Tea Ritual", slug: "wellness" },
  { label: "Housewarming Welcome", slug: "housewarming" },
];

export const Footer = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <footer className="bg-[#1A2E2E] border-t-[3px] border-[#2A7E7C]" data-testid="site-footer">
      <div className="lux-container py-16 grid md:grid-cols-4 gap-10">
        {/* Col 1 — Brand */}
        <div>
          <div className="flex items-center gap-3">
            <svg width="34" height="22" viewBox="0 0 40 24">
              <path d="M 4 18 Q 20 2 36 18" stroke="#2A7E7C" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <path d="M 15 13 Q 20 8 25 13 Q 22 17 20 15 Q 18 17 15 13 Z" fill="#2A7E7C" />
            </svg>
            <span className="font-display text-3xl italic text-white">Da Fruito</span>
          </div>
          <p className="mt-4 text-white/60 italic font-body">The Art of Gifting, Perfected.</p>
          <p className="mt-3 text-[#7A9E9C] font-ui text-[10px] tracking-[0.25em] uppercase">Delivering across Delhi & NCR</p>
          <div className="flex gap-4 mt-5 text-[#7A9E9C]">
            <a href="https://www.instagram.com/da.fruito/" target="_blank" rel="noreferrer" className="hover:text-[#2A7E7C] transition-colors" data-testid="footer-instagram"><Instagram size={18} /></a>
            <a href="https://wa.me/919034782090" target="_blank" rel="noreferrer" className="hover:text-[#2A7E7C] transition-colors" data-testid="footer-whatsapp"><MessageCircle size={18} /></a>
          </div>
        </div>

        {/* Col 2 — Navigate */}
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#2A7E7C] uppercase font-ui mb-4 font-bold">Navigate</div>
          <ul className="space-y-2 font-body">
            <li><Link to="/" className="text-[#7A9E9C] hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/create-hamper" className="text-[#7A9E9C] hover:text-white transition-colors">Bespoke Builder</Link></li>
            <li><Link to="/#collections" className="text-[#7A9E9C] hover:text-white transition-colors">Signature Collections</Link></li>
            <li><Link to="/#contact" className="text-[#7A9E9C] hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Col 3 — Collections */}
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#2A7E7C] uppercase font-ui mb-4 font-bold">Collections</div>
          <ul className="space-y-2 font-body">
            {COLLECTIONS.map((c) => (
              <li key={c.slug}><Link to={`/?occasion=${c.slug}#collections`} className="text-[#7A9E9C] hover:text-white transition-colors">{c.label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Contact */}
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#2A7E7C] uppercase font-ui mb-4 font-bold">Reach Us</div>
          <ul className="space-y-3 font-body">
            <li className="flex items-center gap-3"><MessageCircle size={16} className="text-[#2A7E7C]" /> <a href="https://wa.me/919034782090" target="_blank" rel="noreferrer" className="text-[#2A7E7C] hover:text-white">+91 90347 82090</a></li>
            <li className="flex items-center gap-3"><Mail size={16} className="text-[#7A9E9C]" /> <span className="text-[#7A9E9C]">hello@dafruito.in</span></li>
            <li className="flex items-center gap-3"><Instagram size={16} className="text-[#2A7E7C]" /> <a href="https://www.instagram.com/da.fruito/" target="_blank" rel="noreferrer" className="text-[#2A7E7C] hover:text-white">@da.fruito</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="lux-container py-6 flex flex-col md:flex-row items-center justify-between gap-3 font-ui text-[10px] tracking-[0.25em] uppercase text-[#7A9E9C]">
          <div>© {new Date().getFullYear()} Da Fruito. All rights reserved.</div>
          <div className="flex gap-6 items-center">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms</a>
            {user?.role === "admin" && (
              <Link to="/admin" data-testid="footer-admin-link" className="text-[#7A9E9C] italic hover:text-white">✦ Owner Access</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
