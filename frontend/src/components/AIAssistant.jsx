import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X } from "lucide-react";
import { api } from "../lib/api";

const QUICK_REPLIES = [
  "Gift for an anniversary",
  "Budget under ₹5,000",
  "Corporate hamper",
  "Surprise me",
];

const makeSession = () => `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session] = useState(makeSession);
  const endRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0 && open) {
      setMessages([{ role: "assistant", text: "Hello. I am your gifting curator at Da Fruito. Tell me who you are gifting today, the occasion, and a sense of the budget — I shall compose something extraordinary." }]);
    }
  }, [open, messages.length]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text) => {
    const val = (text || input).trim();
    if (!val || loading) return;
    const next = [...messages, { role: "user", text: val }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const { data } = await api.post("/ai-chat", { session_id: session, message: val, history: next.slice(0, -1) });
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "I apologise — a momentary lapse. Could you try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        data-testid="ai-assistant-toggle"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-gold to-antique text-walnut shadow-[0_0_40px_rgba(201,168,76,0.45)] hover:shadow-[0_0_60px_rgba(232,201,122,0.6)] transition-all duration-500"
        aria-label="AI Gifting Curator"
      >
        <Sparkles size={26} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="ai-assistant-panel"
            initial={{ x: 460, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 460, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-50 right-0 bottom-0 top-0 md:top-auto md:bottom-24 md:right-6 w-full md:w-[420px] md:h-[620px] md:rounded-none glass-dark border-l md:border border-gold/30 flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-gold/20">
              <div>
                <div className="text-[0.65rem] tracking-[0.3em] uppercase text-bronze font-ui">Gifting Curator</div>
                <div className="font-display text-xl text-antique">Da Fruito AI</div>
              </div>
              <button data-testid="ai-close" onClick={() => setOpen(false)} className="text-ivory/60 hover:text-antique"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4" data-testid="ai-messages">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-ivory text-walnut rounded-t-xl rounded-bl-xl" : "bg-walnutSoft border border-gold/25 text-ivory rounded-t-xl rounded-br-xl"}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center text-bronze font-ui text-xs tracking-[0.25em] uppercase">
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "240ms" }} />
                  <span className="ml-2">Composing</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="px-5 py-3 border-t border-gold/15">
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_REPLIES.map((q) => (
                  <button key={q} data-testid={`ai-quick-${q}`} onClick={() => send(q)} className="pill !py-1 !px-3 !text-[0.7rem]">{q}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  data-testid="ai-input"
                  value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Describe the occasion..."
                  className="lux-input"
                />
                <button data-testid="ai-send" onClick={() => send()} className="btn-gold !px-4 !py-3"><Send size={16} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
export default AIAssistant;
