import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";

export const AuthModal = ({ open, onClose }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuthStore();

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back.");
      } else {
        await register(form.name, form.email, form.password);
        toast.success("Account created.");
      }
      onClose && onClose();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="auth-modal"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-md" />
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md glass-light p-10"
          >
            <button data-testid="auth-close" onClick={onClose} className="absolute top-5 right-5 text-walnut/60 hover:text-walnut"><X size={20} /></button>
            <div className="text-center mb-8">
              <div className="text-[0.7rem] tracking-[0.4em] text-bronze uppercase font-ui mb-2">{mode === "login" ? "Welcome Back" : "Join Da Fruito"}</div>
              <h3 className="font-display text-3xl text-walnut">{mode === "login" ? "Sign in" : "Create account"}</h3>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="lux-label !text-bronze">Your Name</label>
                  <input data-testid="auth-name" required className="lux-input !bg-ceramic !text-walnut !border-bronze/40" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              )}
              <div>
                <label className="lux-label !text-bronze">Email</label>
                <input data-testid="auth-email" type="email" required className="lux-input !bg-ceramic !text-walnut !border-bronze/40" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="lux-label !text-bronze">Password</label>
                <input data-testid="auth-password" type="password" required className="lux-input !bg-ceramic !text-walnut !border-bronze/40" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <button data-testid="auth-submit" type="submit" disabled={submitting} className="btn-gold w-full">
                {submitting ? "Please wait..." : (mode === "login" ? "Sign In" : "Create Account")}
              </button>
            </form>
            <div className="text-center mt-6 text-walnut/70 text-sm">
              {mode === "login" ? (
                <>New to Da Fruito? <button data-testid="auth-switch-register" className="text-gold hover:underline" onClick={() => setMode("register")}>Create an account</button></>
              ) : (
                <>Already have an account? <button data-testid="auth-switch-login" className="text-gold hover:underline" onClick={() => setMode("login")}>Sign in</button></>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
