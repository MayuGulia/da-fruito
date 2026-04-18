import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";

export const AuthModal = ({ open, onClose }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { login, register, loginWithGoogle, forgotPassword } = useAuthStore();

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
      toast.error(e?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setGoogleBusy(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google");
      onClose && onClose();
    } catch (e) {
      toast.error(e?.message || "Google sign-in failed");
    } finally {
      setGoogleBusy(false);
    }
  };

  const onForgot = async () => {
    if (!form.email) { toast.error("Please enter your email first."); return; }
    try {
      await forgotPassword(form.email);
      toast.success("Password reset email sent.");
    } catch (e) {
      toast.error(e?.message || "Could not send reset email");
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
              {mode === "login" && (
                <div className="text-right">
                  <button type="button" onClick={onForgot} className="text-xs text-[#9C8878] hover:text-[#B07D62] font-ui tracking-[0.15em] uppercase" data-testid="auth-forgot">Forgot password?</button>
                </div>
              )}
            </form>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#E0D4C8]" />
              <span className="text-xs text-[#9C8878] font-ui tracking-[0.25em] uppercase">or</span>
              <div className="flex-1 h-px bg-[#E0D4C8]" />
            </div>
            <button
              type="button"
              onClick={onGoogle}
              disabled={googleBusy}
              data-testid="auth-google"
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#E0D4C8] hover:border-[#B07D62] text-[#2D2420] font-ui uppercase tracking-[0.15em] text-xs py-3 rounded-full transition-all duration-500"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleBusy ? "Opening Google..." : "Continue with Google"}
            </button>
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
