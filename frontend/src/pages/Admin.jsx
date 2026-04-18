import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api, formatINR } from "../lib/api";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Sparkles, Send, CheckCircle2 } from "lucide-react";

export default function Admin() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cmd, setCmd] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/admin/orders").then(({ data }) => setOrders(data)).catch(() => {});
    api.get("/products").then(({ data }) => setProducts(data)).catch(() => {});
  }, [user]);

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const updateStatus = async (id, status) => {
    try { await api.patch(`/admin/orders/${id}`, { status }); setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o))); toast.success("Updated"); } catch { toast.error("Failed"); }
  };

  const previewCmd = async () => {
    if (!cmd.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post("/ai-inventory", { command: cmd });
      setPreview(data.preview);
    } catch { toast.error("AI could not parse that command."); } finally { setBusy(false); }
  };

  const applyCmd = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const { data } = await api.post("/ai-inventory/apply", preview);
      toast.success(`Applied: ${data.changed} record(s) affected.`);
      setPreview(null); setCmd("");
      const [pRes, sRes] = await Promise.all([api.get("/products"), api.get("/admin/stats")]);
      setProducts(pRes.data);
      setStats(sRes.data);
    } catch (e) { toast.error(e?.response?.data?.detail || "Apply failed"); } finally { setBusy(false); }
  };

  const shownOrders = statusFilter ? orders.filter((o) => (o.status || "").toLowerCase().includes(statusFilter.toLowerCase())) : orders;

  return (
    <div className="min-h-screen pt-28 pb-24" data-testid="admin-page">
      <div className="lux-container">
        <div className="text-[0.7rem] uppercase tracking-[0.4em] text-bronze font-ui">Atelier Operations</div>
        <h2 className="font-display text-5xl md:text-6xl text-ivory mt-2">Admin <em className="italic text-antique">Dashboard</em></h2>

        {/* Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
          {stats && [
            { l: "Revenue Today", v: formatINR(stats.revenue_today) },
            { l: "Revenue Month", v: formatINR(stats.revenue_month) },
            { l: "Total Orders", v: stats.total_orders },
            { l: "Pending", v: stats.pending_orders },
            { l: "In Stock", v: stats.products_in_stock },
            { l: "Out of Stock", v: stats.out_of_stock },
          ].map((s) => (
            <div key={s.l} className="card-lux p-4"><div className="font-ui text-[0.6rem] uppercase tracking-[0.25em] text-bronze">{s.l}</div><div className="font-display text-2xl text-antique mt-1">{s.v}</div></div>
          ))}
        </div>

        {/* AI Inventory Manager */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="text-gold" size={18} />
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-bronze font-ui">AI Inventory Manager</div>
          </div>
          <div className="card-lux p-6">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                className="lux-input flex-1"
                value={cmd} onChange={(e) => setCmd(e.target.value)}
                placeholder="e.g. apply 15% discount to teas, mark champagne truffles out of stock"
                data-testid="inv-cmd"
              />
              <button onClick={previewCmd} disabled={busy} className="btn-outline-gold" data-testid="inv-preview"><Send size={14} /> Preview</button>
            </div>
            {preview && (
              <div className="mt-5 flex items-center justify-between gap-4 glass-light p-5 rounded">
                <div>
                  <div className="font-ui uppercase text-[0.7rem] tracking-[0.3em] text-bronze">Preview</div>
                  <div className="font-display text-walnut text-xl mt-1">{preview.summary || preview.action}</div>
                  <div className="text-sm font-body text-walnut/70 mt-1">Action: <strong>{preview.action}</strong>{preview.target ? ` · Target: ${preview.target}` : ""}{Object.keys(preview.params || {}).length ? ` · ${JSON.stringify(preview.params)}` : ""}</div>
                </div>
                <button onClick={applyCmd} disabled={busy} className="btn-gold" data-testid="inv-apply"><CheckCircle2 size={14} /> Confirm & Apply</button>
              </div>
            )}
          </div>
        </div>

        {/* Orders Management */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[0.7rem] uppercase tracking-[0.3em] text-bronze font-ui">Orders</div>
            <select className="lux-input !py-2 !px-3 !w-auto text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} data-testid="order-filter">
              <option value="">All statuses</option>
              {["Pending", "Confirmed", "In Preparation", "Dispatched", "Delivered"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="card-lux overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-bronze font-ui uppercase tracking-[0.2em] text-[0.65rem]">
                  <th className="text-left p-4">Order</th><th className="text-left p-4">Recipient</th><th className="text-left p-4">Payment</th><th className="text-left p-4">Total</th><th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {shownOrders.length === 0 && <tr><td colSpan={5} className="p-8 text-center font-body italic text-ivory/50">No orders yet.</td></tr>}
                {shownOrders.map((o) => (
                  <tr key={o.id} className="border-t border-bronze/20 text-ivory" data-testid={`admin-order-${o.id}`}>
                    <td className="p-4 font-ui">#{o.id.slice(0, 8)}</td>
                    <td className="p-4"><div>{o.recipient_name}</div><div className="text-ivory/50 text-xs">{o.contact}</div></td>
                    <td className="p-4 capitalize">{o.payment_method}</td>
                    <td className="p-4 font-display text-[#C4A35A]">{formatINR(o.total)}</td>
                    <td className="p-4">
                      <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="lux-input !py-1.5 !px-2 text-xs" data-testid={`status-${o.id}`}>
                        {["Pending", "Pending COD", "Confirmed", "In Preparation", "Dispatched", "Delivered"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products */}
        <div className="mt-14 mb-10">
          <div className="text-[0.7rem] uppercase tracking-[0.3em] text-bronze font-ui mb-4">Products ({products.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 16).map((p) => (
              <div key={p.id} className={`card-lux !p-3 ${!p.in_stock ? "opacity-50" : ""}`}>
                <img src={p.image} alt={p.name} className="w-full h-28 object-cover" />
                <div className="mt-2 font-ui text-xs text-ivory">{p.name}</div>
                <div className="font-display text-[#C4A35A]">{formatINR(p.price)}</div>
                <div className="text-[0.6rem] uppercase tracking-[0.2em] text-bronze">{p.in_stock ? "In stock" : "Out of stock"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
