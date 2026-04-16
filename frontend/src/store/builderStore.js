import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useBuilderStore = create(
  persist(
    (set, get) => ({
      step: 1, // 1, 1.5, 2, 2.5, 3, 4
      vessel: null,
      budget: 5000,
      selectedItems: [], // [{id, name, price, category, ...}]
      giftCard: { enabled: false, occasion: "", message: "", recipient: "" },
      previewImage: null,
      orderDetails: null,
      setStep: (step) => set({ step }),
      setVessel: (vessel) => set({ vessel }),
      setBudget: (budget) => set({ budget }),
      toggleItem: (item) => {
        const exists = get().selectedItems.find((i) => i.id === item.id);
        set({
          selectedItems: exists
            ? get().selectedItems.filter((i) => i.id !== item.id)
            : [...get().selectedItems, item],
        });
      },
      setGiftCard: (giftCard) => set({ giftCard: { ...get().giftCard, ...giftCard } }),
      setPreviewImage: (previewImage) => set({ previewImage }),
      setOrderDetails: (orderDetails) => set({ orderDetails }),
      reset: () => set({
        step: 1,
        vessel: null,
        budget: 5000,
        selectedItems: [],
        giftCard: { enabled: false, occasion: "", message: "", recipient: "" },
        previewImage: null,
        orderDetails: null,
      }),
      runningTotal: () => {
        const base = (get().vessel?.price || 0);
        const items = get().selectedItems.reduce((s, i) => s + i.price, 0);
        return base + items;
      },
      totalWeight: () => get().selectedItems.reduce((s, i) => s + (i.weight_grams || 100), 0),
    }),
    { name: "dafruito_builder" }
  )
);
