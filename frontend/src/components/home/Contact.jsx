import React, { useEffect, useState } from "react";
import { api, buildWhatsAppLink, WHATSAPP_NUMBER_DEFAULT } from "../../lib/api";
import { MessageCircle, Instagram, Mail, Phone } from "lucide-react";
import { Reveal } from "../Reveal";

export const Contact = () => {
  const [num, setNum] = useState(WHATSAPP_NUMBER_DEFAULT);
  useEffect(() => { api.get("/whatsapp-number").then(({ data }) => data?.number && setNum(data.number)).catch(() => {}); }, []);
  return (
    <section id="contact" data-testid="contact-section" className="py-24 md:py-32 bg-[#F5EFE6]">
      <div className="lux-container text-center max-w-3xl">
        <Reveal>
          <div className="text-[0.7rem] tracking-[0.4em] text-[#B07D62] uppercase font-ui mb-3">Reach Us</div>
          <h2 className="font-display text-5xl md:text-6xl text-[#2D2420]">A Question? A <em className="italic text-[#B07D62]">Special Request?</em></h2>
          <p className="font-body italic text-[#5C4A3A] mt-5 text-lg">Our team is one message away.</p>
          <a
            data-testid="contact-whatsapp-cta"
            href={buildWhatsAppLink(num, "Hello Da Fruito, I would love to discuss a gifting commission.")}
            target="_blank" rel="noreferrer"
            className="inline-flex mt-10 items-center gap-3 px-10 py-5 bg-[#25D366] hover:bg-[#1ebe57] text-white font-ui uppercase tracking-[0.2em] text-sm rounded-full transition-all duration-500 shadow-[0_10px_40px_rgba(37,211,102,0.3)]"
          >
            <MessageCircle size={20} /> Message on WhatsApp
          </a>
          <div className="mt-12 flex flex-col md:flex-row gap-8 justify-center items-center text-[#5C4A3A]">
            <div className="flex items-center gap-2"><Phone size={16} className="text-[#B07D62]" /> <span className="font-body">+91 98XXX XXXXX</span></div>
            <div className="flex items-center gap-2"><Mail size={16} className="text-[#B07D62]" /> <span className="font-body">hello@dafruito.in</span></div>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#B07D62]"><Instagram size={16} className="text-[#B07D62]" /> <span className="font-body">@dafruito</span></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
export default Contact;
