import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { api, formatINR, buildWhatsAppLink, WHATSAPP_NUMBER_DEFAULT } from "../lib/api";
import { toast } from "sonner";
import AuthModal from "../components/AuthModal";

export default function Checkout() {
  const { items, total, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();
  const [form, setForm] = useState({ sender_name: user?.name || "", recipient_name: "", contact: "", address: "", delivery_date: "", occasion: "", notes: "" });
  const [method, setMethod] = useState("razorpay");
  const [authOpen, setAuthOpen] = useState(!user);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) { return (
    <div className="min-h-screen pt-32 text-center">
      <div className="lux-container"><h2 className="font-display text-4xl text-ivory">Your cart is empty.</h2></div>
    </div>
  ); }

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, kind: i.kind, bespoke: i.bespoke })),
        total: total(),
        ...form,
        payment_method: method,
      };
      if (method === "razorpay") {
        const { data: order } = await api.post("/create-order", { amount: total() * 100, currency: "INR" });
        await api.post("/verify-payment", { razorpay_order_id: order.id, razorpay_payment_id: `pay_mock_${Date.now()}`, razorpay_signature: "mock" });
        payload.razorpay_order_id = order.id;
      }
      if (method === "whatsapp") {
        const lines = [
          "*Da Fruito — Order Request*", "",
          `*Sender:* ${form.sender_name}`,
          `*Recipient:* ${form.recipient_name} (${form.contact})`,
          `*Address:* ${form.address}`,
          `*Occasion:* ${form.occasion || "—"}`,
          ``,
          `*Items:*`,
          ...items.map((i) => `  — ${i.name} · ${formatINR(i.price)}`),
          ``,
          `*Total:* ${formatINR(total())}`,
        ].join("\n");
        window.open(buildWhatsAppLink(WHATSAPP_NUMBER_DEFAULT, lines), "_blank");
      }
      await api.post("/orders", payload);
      await clear();
      toast.success("Order confirmed. Our atelier will reach out shortly.");
      nav("/account");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Order failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-24" data-testid="checkout-page">
      <div className="lux-container">
        <h2 className="font-display text-5xl md:text-6xl text-ivory mb-10">Checkout</h2>
        <form onSubmit={placeOrder} className="grid lg:grid-cols-[1.3fr_1fr] gap-12">
          <div className="space-y-4">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-bronze font-ui">Delivery Details</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="lux-label">Your Name*</label><input required className="lux-input" value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} data-testid="co-sender" /></div>
              <div><label className="lux-label">Recipient Name*</label><input required className="lux-input" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} data-testid="co-recipient" /></div>
              <div><label className="lux-label">Contact Number*</label><input required className="lux-input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} data-testid="co-contact" /></div>
              <div><label className="lux-label">Occasion</label><input className="lux-input" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} data-testid="co-occasion" /></div>
              <div className="md:col-span-2"><label className="lux-label">Address*</label><textarea required rows={3} className="lux-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="co-address" /></div>
              <div><label className="lux-label">Delivery Date</label><input type="date" className="lux-input" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></div>
              <div><label className="lux-label">Notes</label><input className="lux-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="mt-8 text-[0.7rem] uppercase tracking-[0.3em] text-bronze font-ui">Payment Method</div>
            <div className="grid md:grid-cols-3 gap-3">
              {["razorpay", "cod", "whatsapp"].map((m) => (
                <button type="button" key={m} onClick={() => setMethod(m)} className={`card-lux !p-4 text-left ${method === m ? "ring-2 ring-gold" : ""}`} data-testid={`pay-${m}`}>
                  <div className="font-ui uppercase tracking-[0.2em] text-[0.72rem] text-antique">{m === "razorpay" ? "Razorpay" : m === "cod" ? "Cash on Delivery" : "WhatsApp Order"}</div>
                  <div className="font-body italic text-ivory/60 text-sm mt-1">{m === "razorpay" ? "UPI, cards, netbanking" : m === "cod" ? "Pay on receipt" : "Message our team"}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="card-lux p-6 h-fit sticky top-28">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] font-ui text-bronze mb-3">Order Summary</div>
            {items.map((i) => (
              <div key={i.id} className="flex justify-between py-2 font-body text-ivory/80 text-sm"><span>{i.name}</span><span className="text-antique">{formatINR(i.price * (i.quantity || 1))}</span></div>
            ))}
            <div className="hr-gold my-4" />
            <div className="flex justify-between font-display text-2xl text-antique"><span>Total</span><span>{formatINR(total())}</span></div>
            <button type="submit" disabled={submitting} className="btn-gold w-full mt-6" data-testid="co-submit">
              {submitting ? "Processing..." : "Place Order"}
            </button>
          </div>
        </form>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
