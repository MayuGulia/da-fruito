import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      isAdmin: () => get().user?.role === "admin",
      setAuth: (user, token) => {
        if (token) localStorage.setItem("dafruito_token", token);
        set({ user, token });
      },
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          localStorage.setItem("dafruito_token", data.token);
          set({ user: data.user, token: data.token, loading: false });
          return data.user;
        } catch (e) {
          set({ error: e?.response?.data?.detail || "Login failed", loading: false });
          throw e;
        }
      },
      register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post("/auth/register", { name, email, password });
          localStorage.setItem("dafruito_token", data.token);
          set({ user: data.user, token: data.token, loading: false });
          return data.user;
        } catch (e) {
          set({ error: e?.response?.data?.detail || "Registration failed", loading: false });
          throw e;
        }
      },
      fetchMe: async () => {
        const token = localStorage.getItem("dafruito_token");
        if (!token) return null;
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data, token });
          return data;
        } catch {
          localStorage.removeItem("dafruito_token");
          set({ user: null, token: null });
          return null;
        }
      },
      logout: () => {
        localStorage.removeItem("dafruito_token");
        set({ user: null, token: null });
      },
    }),
    { name: "dafruito_auth", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
