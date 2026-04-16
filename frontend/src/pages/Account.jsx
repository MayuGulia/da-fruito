import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api, formatINR } from "../lib/api";
import { Link } from "react-router-dom";

export default function Account() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/orders").then(({ data }) => setOrders(data)).catch(() => {});
  }, [user]);

  if (!user) return (
    <div className="min-h-screen pt-32 text-center" data-testid="account-unauth">
      <div className="lux-container">
        <h2 className="font-display text-5xl text-ivory">Please sign in</h2>
        <Link to="/" className="btn-gold mt-8 inline-flex">Return Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-24" data-testid="account-page">
      <div className="lux-container">
        <div className="text-[0.7rem] uppercase tracking-[0.4em] text-bronze font-ui">My Account</div>
        <h2 className="font-display text-5xl md:text-6xl text-ivory mt-2">Good to see you, <em className="italic text-antique">{user.name}</em></h2>
        <div className="hr-gold w-32 mt-6 mb-12" />

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card-lux p-6"><div className="text-bronze font-ui uppercase tracking-[0.3em] text-[0.7rem] mb-2">Email</div><div className="text-ivory">{user.email}</div></div>
          <div className="card-lux p-6"><div className="text-bronze font-ui uppercase tracking-[0.3em] text-[0.7rem] mb-2">Role</div><div className="text-ivory capitalize">{user.role}</div></div>
          <div className="card-lux p-6"><div className="text-bronze font-ui uppercase tracking-[0.3em] text-[0.7rem] mb-2">Orders</div><div className="text-ivory">{orders.length}</div></div>
        </div>

        <div className="text-[0.7rem] uppercase tracking-[0.3em] text-bronze font-ui mb-4">Your Orders</div>
        {orders.length === 0 ? (
          <div className="card-lux p-8 text-ivory/60 italic">You have no orders yet. Allow us to compose your first.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="card-lux p-5 flex flex-wrap gap-3 items-center justify-between" data-testid={`order-${o.id}`}>
                <div>
                  <div className="font-display text-xl text-ivory">Order #{o.id.slice(0, 8)}</div>
                  <div className="font-body italic text-ivory/60 text-sm">{new Date(o.created_at).toLocaleString()} · {o.items.length} item(s) · {o.payment_method}</div>
                </div>
                <div className="font-ui text-[0.7rem] tracking-[0.2em] uppercase text-antique">{o.status}</div>
                <div className="font-display text-2xl text-antique">{formatINR(o.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
