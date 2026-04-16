import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // local cart (for guest & mirror)
      loading: false,
      fetch: async () => {
        const token = localStorage.getItem("dafruito_token");
        if (!token) return;
        set({ loading: true });
        try {
          const { data } = await api.get("/cart");
          set({ items: data, loading: false });
        } catch {
          set({ loading: false });
        }
      },
      add: async (item) => {
        const token = localStorage.getItem("dafruito_token");
        if (token) {
          const { data } = await api.post("/cart", item);
          set({ items: [...get().items, data] });
        } else {
          const local = { ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() };
          set({ items: [...get().items, local] });
        }
      },
      remove: async (id) => {
        const token = localStorage.getItem("dafruito_token");
        if (token) {
          try { await api.delete(`/cart/${id}`); } catch {}
        }
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      clear: async () => {
        const token = localStorage.getItem("dafruito_token");
        if (token) { try { await api.delete("/cart"); } catch {} }
        set({ items: [] });
      },
      total: () => get().items.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0),
      count: () => get().items.reduce((s, i) => s + (i.quantity || 1), 0),
    }),
    { name: "dafruito_cart", partialize: (s) => ({ items: s.items }) }
  )
);
