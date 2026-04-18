import React from "react";
import { Link } from "react-router-dom";
import { Instagram, MessageCircle, Mail } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export const Footer = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <footer className="bg-[#2D2420] border-t-[3px] border-[#B07D62]" data-testid="site-footer">
      <div className="lux-container py-16 grid md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center gap-3">
            <svg width="34" height="22" viewBox="0 0 40 24">
              <path d="M 4 18 Q 20 2 36 18" stroke="#E8CFC4" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <path d="M 15 13 Q 20 8 25 13 Q 22 17 20 15 Q 18 17 15 13 Z" fill="#E8CFC4" />
            </svg>
            <span className="font-display text-3xl text-white">Da Fruito</span>
          </div>
          <p className="mt-4 text-white/70 italic font-body">The Art of Gifting, Perfected.</p>
          <p className="mt-3 text-[#E8CFC4] font-ui text-xs tracking-[0.25em] uppercase">Delivering across Delhi & NCR</p>
        </div>
        <div>
          <div className="text-[0.7rem] tracking-[0.3em] text-[#E8CFC4] uppercase font-ui mb-4">Navigate</div>
          <ul className="space-y-2 font-body text-white/80">
            <li><Link to="/" className="hover:text-[#E8CFC4]">Home</Link></li>
            <li><Link to="/create-hamper" className="hover:text-[#E8CFC4]">Bespoke Builder</Link></li>
            <li><Link to="/#collections" className="hover:text-[#E8CFC4]">Signature Collections</Link></li>
            <li><Link to="/#contact" className="hover:text-[#E8CFC4]">Contact</Link></li>
            {user?.role === "admin" && (
              <li><Link to="/admin" className="text-[#E8CFC4] hover:text-white" data-testid="footer-admin-link">Admin Panel</Link></li>
            )}
          </ul>
          <div className="flex gap-4 mt-5 text-white/70">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#E8CFC4]" data-testid="footer-instagram"><Instagram size={18} /></a>
            <a href="https://wa.me/911234567890" target="_blank" rel="noreferrer" className="hover:text-[#E8CFC4]" data-testid="footer-whatsapp"><MessageCircle size={18} /></a>
          </div>
        </div>
        <div>
          <div className="text-[0.7rem] tracking-[0.3em] text-[#E8CFC4] uppercase font-ui mb-4">Reach Us</div>
          <ul className="space-y-3 font-body">
            <li className="flex items-center gap-3 text-white/80"><MessageCircle size={16} className="text-[#E8CFC4]" /> +91 98XXX XXXXX</li>
            <li className="flex items-center gap-3 text-white/80"><Mail size={16} className="text-[#E8CFC4]" /> hello@dafruito.in</li>
            <li className="flex items-center gap-3 text-white/80"><Instagram size={16} className="text-[#E8CFC4]" /> @dafruito</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="lux-container py-6 flex flex-col md:flex-row items-center justify-between gap-3 font-ui text-[0.72rem] tracking-[0.25em] uppercase text-white/40">
          <div>© {new Date().getFullYear()} Da Fruito. All rights reserved.</div>
          <div className="flex gap-6"><a href="#" className="hover:text-[#E8CFC4]">Privacy Policy</a><a href="#" className="hover:text-[#E8CFC4]">Terms</a></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
