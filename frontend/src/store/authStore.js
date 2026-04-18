import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { api } from "../lib/api";

// Sync a Firebase-authenticated user with the backend and receive a backend JWT.
// This keeps MongoDB as the source of truth for role/orders/cart while Firebase
// handles credentials, sessions, and social sign-in.
const syncWithBackend = async (firebaseUser) => {
  const idToken = await firebaseUser.getIdToken(/* forceRefresh */ false);
  const { data } = await api.post("/auth/firebase-sync", {
    id_token: idToken,
    name: firebaseUser.displayName || "",
    email: firebaseUser.email || "",
  });
  localStorage.setItem("dafruito_token", data.token);
  return data;
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      initialized: false,

      isAdmin: () => get().user?.role === "admin",

      setAuth: (user, token) => {
        if (token) localStorage.setItem("dafruito_token", token);
        set({ user, token });
      },

      // Email/password sign in via Firebase, then sync with backend
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const data = await syncWithBackend(cred.user);
          set({ user: data.user, token: data.token, loading: false });
          return data.user;
        } catch (e) {
          const msg = e?.response?.data?.detail || e?.message || "Sign in failed";
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      // Email/password sign up via Firebase (display name set), then sync
      register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          if (name) {
            try { await updateProfile(cred.user, { displayName: name }); } catch {}
          }
          const data = await syncWithBackend(cred.user);
          set({ user: data.user, token: data.token, loading: false });
          return data.user;
        } catch (e) {
          const msg = e?.response?.data?.detail || e?.message || "Registration failed";
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      // Google sign-in (popup), then sync
      loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          const cred = await signInWithPopup(auth, googleProvider);
          const data = await syncWithBackend(cred.user);
          set({ user: data.user, token: data.token, loading: false });
          return data.user;
        } catch (e) {
          const msg = e?.message || "Google sign in failed";
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      // Password reset email
      forgotPassword: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },

      // Called on app mount: hydrate from Firebase + backend JWT
      initAuthListener: () => {
        if (get().initialized) return;
        set({ initialized: true });
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // If we already have a valid backend token for this user, just fetch /me
            const token = localStorage.getItem("dafruito_token");
            if (token) {
              try {
                const { data } = await api.get("/auth/me");
                set({ user: data, token });
                return;
              } catch {
                // token invalid, fall through to sync
              }
            }
            try {
              const data = await syncWithBackend(firebaseUser);
              set({ user: data.user, token: data.token });
            } catch (e) {
              // If sync fails, sign out to avoid half-authenticated state
              try { await fbSignOut(auth); } catch {}
              localStorage.removeItem("dafruito_token");
              set({ user: null, token: null });
            }
          } else {
            localStorage.removeItem("dafruito_token");
            set({ user: null, token: null });
          }
        });
      },

      logout: async () => {
        try { await fbSignOut(auth); } catch {}
        localStorage.removeItem("dafruito_token");
        set({ user: null, token: null });
      },
    }),
    { name: "dafruito_auth", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
