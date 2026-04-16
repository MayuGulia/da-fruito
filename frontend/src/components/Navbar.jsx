import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, User, Menu, X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import AuthModal from "./AuthModal";

const OCCASIONS = [
  { slug: "anniversary", label: "For Everlasting Bonds" },
  { slug: "birthday", label: "The Celebration Edit" },
  { slug: "festive", label: "The Festive Heirloom" },
  { slug: "corporate", label: "The Corporate Gesture" },
  { slug: "wellness", label: "The Sage Tea Ritual" },
  { slug: "housewarming", label: "Housewarming Welcome" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const count = useCartStore((s) => s.count());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setMega(false); }, [loc.pathname]);

  const isHome = loc.pathname === "/";
  const bg = scrolled || !isHome ? "bg-[#1A1510]/90 backdrop-blur-lg border-b border-gold/20" : "bg-transparent";

  return (
    <>
      <motion.header
        data-testid="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${bg}`}
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
      >
        <div className="lux-container flex items-center justify-between py-4">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 group">
            <svg width="34" height="22" viewBox="0 0 40 24" className="shrink-0">
              <path d="M 4 18 Q 20 2 36 18" stroke="#C9A84C" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M 15 13 Q 20 8 25 13 Q 22 17 20 15 Q 18 17 15 13 Z" fill="#E8C97A" />
            </svg>
            <span className="font-display text-2xl md:text-3xl tracking-wide text-ivory group-hover:text-antique transition-colors duration-500">Da Fruito</span>
          </Link>

          {/* Center nav desktop */}
          <nav className="hidden lg:flex items-center gap-10 font-ui text-[0.82rem] uppercase tracking-[0.2em]">
            <button
              data-testid="nav-collections"
              onClick={() => setMega((v) => !v)}
              onMouseEnter={() => setMega(true)}
              className="flex items-center gap-1 text-ivory/80 hover:text-antique transition-colors"
            >
              Collections <ChevronDown size={14} className={`transition-transform ${mega ? "rotate-180" : ""}`} />
            </button>
            <NavLink to="/#about" data-testid="nav-about" className="text-ivory/80 hover:text-antique transition-colors">About</NavLink>
            <NavLink to="/#contact" data-testid="nav-contact" className="text-ivory/80 hover:text-antique transition-colors">Contact</NavLink>
          </nav>

          <div className="flex items-center gap-3 md:gap-5">
            <Link to="/create-hamper" data-testid="nav-create-cta" className="hidden md:inline-flex btn-gold !py-2.5 !px-5 !text-[0.72rem]">Create Your Gift Hamper</Link>
            <button data-testid="nav-search" className="hidden md:inline-flex text-ivory/80 hover:text-antique transition-colors"><Search size={18} /></button>
            <Link to="/cart" data-testid="nav-cart" className="relative text-ivory/80 hover:text-antique transition-colors">
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-walnut text-[10px] font-ui font-bold w-4 h-4 rounded-full flex items-center justify-center">{count}</span>
              )}
            </Link>
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/account" data-testid="nav-account" className="text-ivory/80 hover:text-antique transition-colors"><User size={20} /></Link>
                {user.role === "admin" && (
                  <Link to="/admin" data-testid="nav-admin" title="Admin" className="text-gold hover:text-antique transition-colors"><LayoutDashboard size={18} /></Link>
                )}
                <button data-testid="nav-logout" onClick={logout} className="text-ivory/60 hover:text-antique transition-colors"><LogOut size={18} /></button>
              </div>
            ) : (
              <button data-testid="nav-signin" onClick={() => setAuthOpen(true)} className="hidden md:inline-flex text-ivory/80 hover:text-antique transition-colors"><User size={20} /></button>
            )}
            <button data-testid="nav-mobile-toggle" className="lg:hidden text-ivory" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Mega dropdown */}
        <AnimatePresence>
          {mega && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              onMouseLeave={() => setMega(false)}
              className="absolute left-0 right-0 top-full glass-dark border-t border-gold/30"
              data-testid="nav-mega"
            >
              <div className="lux-container grid md:grid-cols-3 gap-10 py-10">
                <div>
                  <div className="text-[0.7rem] tracking-[0.3em] text-bronze uppercase font-ui mb-4">Signature Collections</div>
                  <ul className="space-y-3">
                    {OCCASIONS.map((o) => (
                      <li key={o.slug}>
                        <button
                          data-testid={`nav-mega-${o.slug}`}
                          onClick={() => { nav(`/?occasion=${o.slug}#collections`); setMega(false); }}
                          className="font-display text-2xl text-ivory hover:text-antique transition-colors"
                        >
                          {o.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[0.7rem] tracking-[0.3em] text-bronze uppercase font-ui mb-4">Bespoke</div>
                  <Link to="/create-hamper" className="block group">
                    <div className="font-display text-3xl text-antique group-hover:text-gold transition-colors">Create Your Own</div>
                    <p className="text-ivory/70 mt-2">Choose a vessel, curate confections, and we shall compose it for you.</p>
                  </Link>
                </div>
                <div className="relative overflow-hidden">
                  <img alt="" src="https://images.unsplash.com/photo-1732928730431-11c206639a38?w=800&q=80" className="w-full h-40 object-cover" />
                  <div className="mt-4 text-ivory/60 italic">"Every hamper we create is a conversation between art and generosity."</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            data-testid="nav-mobile"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-obsidian/98"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gold/20">
              <span className="font-display text-3xl text-antique">Da Fruito</span>
              <button data-testid="nav-mobile-close" onClick={() => setMobileOpen(false)} className="text-ivory"><X size={24} /></button>
            </div>
            <div className="px-6 py-8 space-y-6">
              <Link to="/create-hamper" className="btn-gold w-full">Create Your Gift Hamper</Link>
              <div className="hr-gold my-6" />
              <div className="text-[0.7rem] tracking-[0.3em] text-bronze uppercase font-ui mb-2">Collections</div>
              {OCCASIONS.map((o) => (
                <Link key={o.slug} to={`/?occasion=${o.slug}#collections`} className="block font-display text-2xl text-ivory hover:text-antique">{o.label}</Link>
              ))}
              <div className="hr-gold my-6" />
              <Link to="/cart" className="block font-ui uppercase tracking-widest text-ivory/80">Cart ({count})</Link>
              {user ? (
                <>
                  <Link to="/account" className="block font-ui uppercase tracking-widest text-ivory/80">Account</Link>
                  {user.role === "admin" && <Link to="/admin" className="block font-ui uppercase tracking-widest text-gold">Admin</Link>}
                  <button onClick={logout} className="block font-ui uppercase tracking-widest text-ivory/60">Sign out</button>
                </>
              ) : (
                <button onClick={() => { setMobileOpen(false); setAuthOpen(true); }} className="block font-ui uppercase tracking-widest text-ivory/80">Sign in</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
