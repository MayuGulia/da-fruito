import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { api, buildWhatsAppLink, WHATSAPP_NUMBER_DEFAULT } from "../lib/api";

export const FloatingWhatsApp = ({ message = "Hello Da Fruito, I'd love to learn more about your hampers." }) => {
  const [num, setNum] = useState(WHATSAPP_NUMBER_DEFAULT);
  useEffect(() => {
    api.get("/whatsapp-number").then(({ data }) => data?.number && setNum(data.number)).catch(() => {});
  }, []);
  return (
    <motion.a
      data-testid="floating-whatsapp"
      href={buildWhatsAppLink(num, message)}
      target="_blank" rel="noreferrer"
      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.8, duration: 0.6, ease: [0.22,1,0.36,1] }}
      className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full flex items-center justify-center bg-[#25D366] hover:bg-[#1ebe57] transition-all duration-500 shadow-[0_10px_30px_rgba(37,211,102,0.35)]"
      aria-label="WhatsApp"
    >
      <MessageCircle size={26} className="text-white" />
    </motion.a>
  );
};
export default FloatingWhatsApp;
