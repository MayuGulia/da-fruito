import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { formatINR } from "../lib/api";
import { toast } from "sonner";

export default function Cart() {
  const { items, remove, total, fetch } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();
  useEffect(() => { if (user) fetch(); }, [user, fetch]);

  if (items.length === 0) return (
    <div className="min-h-screen pt-32 pb-24 text-center" data-testid="cart-empty">
      <div className="lux-container">
        <ShoppingBag className="mx-auto text-gold" size={54} />
        <h2 className="font-display text-5xl text-ivory mt-6">Your Cart is Empty</h2>
        <p className="font-body italic text-ivory/60 mt-3">Allow us to curate something extraordinary.</p>
        <div className="flex gap-3 justify-center mt-10">
          <Link to="/" className="btn-outline-gold">Explore Collections</Link>
          <Link to="/create-hamper" className="btn-gold">Create Your Gift Hamper</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-24" data-testid="cart-page">
      <div className="lux-container">
        <button onClick={() => nav(-1)} className="inline-flex items-center gap-2 text-bronze hover:text-antique font-ui text-[0.7rem] tracking-[0.3em] uppercase mb-6"><ArrowLeft size={14} /> Continue Browsing</button>
        <h2 className="font-display text-5xl md:text-6xl text-ivory">Your <em className="italic text-antique">Cart</em></h2>
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 mt-12">
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.id} className="card-lux !p-4 flex gap-4" data-testid={`cart-item-${it.id}`}>
                <img src={it.image || "/placeholder.png"} alt={it.name} className="w-28 h-28 object-cover" />
                <div className="flex-1">
                  <div className="font-ui text-[0.62rem] tracking-[0.3em] uppercase text-bronze">{it.kind === "bespoke" ? "Bespoke Hamper" : "Signature Hamper"}</div>
                  <div className="font-display text-2xl text-ivory">{it.name}</div>
                  <div className="font-display text-xl text-antique mt-3">{formatINR(it.price * (it.quantity || 1))}</div>
                </div>
                <button onClick={() => { remove(it.id); toast.success("Removed from cart"); }} className="text-ivory/60 hover:text-antique self-start" data-testid={`remove-${it.id}`}><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
          <div className="card-lux p-6 h-fit sticky top-28">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] font-ui text-bronze mb-3">Order Summary</div>
            <div className="flex justify-between font-body text-ivory"><span>Subtotal</span><span>{formatINR(total())}</span></div>
            <div className="flex justify-between font-body italic text-ivory/60 mt-2"><span>Delivery</span><span>Complimentary in Delhi & NCR</span></div>
            <div className="hr-gold my-4" />
            <div className="flex justify-between font-display text-2xl text-antique"><span>Total</span><span>{formatINR(total())}</span></div>
            <Link to="/checkout" className="btn-gold w-full mt-6" data-testid="cart-checkout">Proceed to Checkout</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
