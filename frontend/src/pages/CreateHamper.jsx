import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ArrowLeft, Lock, Sparkles, Heart, Package2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatINR, buildWhatsAppLink, WHATSAPP_NUMBER_DEFAULT } from "../lib/api";
import { useBuilderStore } from "../store/builderStore";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";

const STEPS = [
  { id: 1, label: "Vessel" },
  { id: 1.5, label: "Budget" },
  { id: 2, label: "Confections" },
  { id: 2.5, label: "Gift Card" },
  { id: 3, label: "Preview" },
  { id: 4, label: "Details" },
];

const CATEGORIES = [
  { id: "chocolates", label: "Chocolates & Truffles" },
  { id: "biscuits",   label: "Biscuits & Cookies" },
  { id: "nuts",       label: "Nuts & Dried Fruits" },
  { id: "teas",       label: "Teas & Coffee" },
  { id: "snacks",     label: "Gourmet Snacks" },
  { id: "artisan",    label: "Artisan Keepsakes" },
];

const OCCASION_TILES = [
  { id: "anniversary", label: "Anniversary", templates: [
    "Wishing you many more golden years together. With love.",
    "To the extraordinary chapter you continue to write. Happy anniversary.",
    "For the love that quietly astonishes us all.",
  ]},
  { id: "birthday", label: "Birthday", templates: [
    "May this year be kinder, richer, and sweeter than ever. Happy birthday.",
    "A small token for a remarkable soul. With warmth.",
    "Wishing you a year as luminous as you are.",
  ]},
  { id: "festive", label: "Festive", templates: [
    "Wishing your home abundance, warmth, and light.",
    "With gratitude and festive wishes to your family.",
    "May this season be composed of beautiful moments.",
  ]},
  { id: "corporate", label: "Corporate", templates: [
    "A small gesture of appreciation for a remarkable partnership.",
    "With compliments from our team to yours.",
    "With our sincere gratitude.",
  ]},
  { id: "wellness", label: "Wellness", templates: [
    "A ritual for slow mornings and quieter afternoons.",
    "With a wish for gentle days ahead.",
    "For rest, for pause, for you.",
  ]},
  { id: "housewarming", label: "Housewarming", templates: [
    "Welcome to a home that will soon hold so much joy.",
    "With a wish for warm mornings and luminous evenings.",
    "May these walls be filled with laughter.",
  ]},
];

// Elegant image-loading bar shown while the AI composes the bespoke hamper preview.
// Replaces the earlier brand-animated ribbon/bow assembly sequence per user request.
const ComposingBar = ({ active }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!active) { setPct(100); return; }
    setPct(0);
    let p = 0;
    const id = setInterval(() => {
      // ease toward 92% while active; jump to 100 when active flips to false
      p = p + (92 - p) * 0.08;
      setPct(Math.min(92, Math.round(p)));
    }, 180);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="w-full max-w-xl mx-auto" data-testid="composing-bar">
      <div className="flex items-center justify-between mb-3 font-ui text-[0.68rem] tracking-[0.3em] uppercase text-[#2A7E7C]">
        <span>{active ? "Composing your hamper" : "Composed"}</span>
        <span>{active ? `${pct}%` : "100%"}</span>
      </div>
      <div className="relative h-[6px] bg-[#E6F4F3] rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2A7E7C] via-[#3D9E9C] to-[#C4A35A] rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: active ? `${pct}%` : "100%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
        {active && (
          <motion.div
            className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ x: ["-80px", "600px"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
      <p className="text-center font-body italic text-[#7A9E9C] mt-4 text-sm">
        {active ? "Our atelier is carefully arranging each element." : "Your bespoke hamper is ready."}
      </p>
    </div>
  );
};

export default function CreateHamper() {
  const nav = useNavigate();
  const { step, setStep, vessel, setVessel, budget, setBudget, selectedItems, toggleItem, giftCard, setGiftCard, previewImage, setPreviewImage, runningTotal, totalWeight, reset } = useBuilderStore();
  const [vessels, setVessels] = useState([]);
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState("chocolates");
  const [loadingImg, setLoadingImg] = useState(false);
  const [whatsappNum, setWhatsappNum] = useState(WHATSAPP_NUMBER_DEFAULT);
  const addToCart = useCartStore((s) => s.add);
  const user = useAuthStore((s) => s.user);
  const [details, setDetails] = useState({ sender_name: "", recipient_name: "", contact: "", address: "", delivery_date: "", occasion: "", notes: "" });

  useEffect(() => {
    api.get("/vessels").then(({ data }) => setVessels(data)).catch(() => {});
    api.get("/products").then(({ data }) => setProducts(data)).catch(() => {});
    api.get("/whatsapp-number").then(({ data }) => data?.number && setWhatsappNum(data.number)).catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => products.filter((p) => p.category === cat), [products, cat]);
  const total = runningTotal();
  const weight = totalWeight();
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const next = () => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1].id);
  };
  const back = () => {
    const i = STEPS.findIndex((s) => s.id === step);
    if (i > 0) setStep(STEPS[i - 1].id);
  };

  const composeHamperImage = async () => {
    setLoadingImg(true);
    try {
      const { data } = await api.post("/generate-hamper-image", {
        vessel, items: selectedItems, gift_card: giftCard, occasion: details.occasion,
      });
      setPreviewImage(data.image_data_url);
    } catch {
      toast.error("Could not compose preview. Please try again.");
    } finally {
      setLoadingImg(false);
    }
  };

  // Auto-compose on entering step 3
  useEffect(() => {
    if (step === 3 && !previewImage) composeHamperImage();
    // eslint-disable-next-line
  }, [step]);

  const bespokePayload = () => ({
    vessel, items: selectedItems, giftCard, budget, total,
  });

  const addBespokeToCart = async () => {
    if (!user) { toast.error("Please sign in to add to cart."); return; }
    await addToCart({ kind: "bespoke", name: `Bespoke Hamper · ${vessel?.name}`, price: total, image: previewImage || vessel?.image, quantity: 1, bespoke: bespokePayload() });
    toast.success("Your bespoke hamper has been added to cart.");
    nav("/cart");
  };

  const whatsappCompose = () => {
    const lines = [
      "*Da Fruito — Bespoke Hamper Order*",
      "",
      `*Sender:* ${details.sender_name || "—"}`,
      `*Recipient:* ${details.recipient_name || "—"} (${details.contact || "—"})`,
      `*Address:* ${details.address || "—"}`,
      `*Occasion:* ${details.occasion || "—"}`,
      `*Delivery:* ${details.delivery_date || "As soon as possible"}`,
      "",
      `*Vessel:* ${vessel?.name || "—"} (${vessel?.material || ""}) — ${formatINR(vessel?.price || 0)}`,
      `*Items:*`,
      ...selectedItems.map((i) => `  — ${i.name} (${i.country}) · ${formatINR(i.price)}`),
      giftCard?.enabled ? `*Gift card:* "${giftCard.message}"` : `*Gift card:* No`,
      "",
      `*Budget:* ${formatINR(budget)}`,
      `*Estimated total:* ${formatINR(total)}`,
      details.notes ? `*Notes:* ${details.notes}` : "",
    ].filter(Boolean).join("\n");
    return buildWhatsAppLink(whatsappNum, lines);
  };

  const placeOrder = async (method) => {
    if (!vessel || selectedItems.length === 0) { toast.error("Please complete your hamper."); return; }
    if (!details.sender_name || !details.recipient_name || !details.contact || !details.address) { toast.error("Please fill all required delivery details."); return; }
    try {
      if (method === "razorpay") {
        const { data: order } = await api.post("/create-order", { amount: total * 100, currency: "INR" });
        // In mock mode, just verify & persist
        await api.post("/verify-payment", { razorpay_order_id: order.id, razorpay_payment_id: `pay_mock_${Date.now()}`, razorpay_signature: "mock" });
        await api.post("/orders", { items: [{ ...bespokePayload(), name: `Bespoke · ${vessel?.name}` }], total, ...details, payment_method: "razorpay", razorpay_order_id: order.id });
        toast.success("Payment successful. Your bespoke hamper is being prepared.");
        reset(); nav("/account");
      } else if (method === "cod") {
        await api.post("/orders", { items: [{ ...bespokePayload(), name: `Bespoke · ${vessel?.name}` }], total, ...details, payment_method: "cod" });
        toast.success("Order placed. Cash on delivery confirmed.");
        reset(); nav("/account");
      } else if (method === "whatsapp") {
        window.open(whatsappCompose(), "_blank");
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Order failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] pt-24 pb-24" data-testid="create-hamper">
      {/* Progress */}
      <div className="lux-container">
        <div className="flex items-center justify-between mb-2 text-[#7A9E9C] font-ui text-[0.7rem] tracking-[0.3em] uppercase">
          <button onClick={() => nav("/")} className="flex items-center gap-2 hover:text-[#2A7E7C]" data-testid="builder-exit"><ArrowLeft size={14} /> Exit Builder</button>
          <div>Step {currentStepIndex + 1} of {STEPS.length}</div>
        </div>
        <div className="relative h-[2px] bg-[#C8DEDD] my-6">
          <motion.div className="absolute top-0 left-0 h-full bg-[#2A7E7C]" animate={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }} transition={{ duration: 0.6 }} />
          <div className="absolute inset-0 flex justify-between -top-[10px]">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{
                    backgroundColor: i < currentStepIndex ? "#7A9E9C" : (i === currentStepIndex ? "#2A7E7C" : "#FFFFFF"),
                    borderColor: i <= currentStepIndex ? "#2A7E7C" : "#C8DEDD",
                    boxShadow: i === currentStepIndex ? "0 0 0 4px rgba(176,125,98,0.2)" : "0 0 0 0 rgba(176,125,98,0)",
                  }}
                  className="w-5 h-5 rounded-full border flex items-center justify-center"
                >
                  {i < currentStepIndex && <Check size={12} className="text-white" />}
                </motion.div>
                <span className={`hidden md:block font-ui text-[0.64rem] tracking-[0.25em] uppercase ${i === currentStepIndex ? "text-[#2A7E7C]" : "text-[#7A9E9C]"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
          transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
          className="lux-container mt-14"
        >
          {step === 1 && (
            <div data-testid="step-vessel">
              <div className="text-center mb-12">
                <div className="text-[0.7rem] tracking-[0.4em] text-bronze uppercase font-ui mb-3">Step One</div>
                <h2 className="font-display text-5xl md:text-6xl text-ivory">Begin with the <em className="italic text-[#C4A35A]">Extraordinary</em></h2>
                <p className="font-body italic text-ivory/70 mt-4 text-lg">Every masterpiece starts with its canvas.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {vessels.map((v) => (
                  <motion.button
                    key={v.id}
                    data-testid={`vessel-${v.id}`}
                    onClick={() => setVessel(v)}
                    whileHover={{ y: -4 }}
                    className={`card-lux text-left ${vessel?.id === v.id ? "ring-2 ring-gold glow-gold-strong" : ""}`}
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                      {vessel?.id === v.id && (
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gold flex items-center justify-center animate-gold-pulse">
                          <Check className="text-walnut" size={20} />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="font-display text-2xl text-ivory">{v.name}</div>
                      <div className="font-ui uppercase tracking-[0.2em] text-[0.65rem] text-bronze mt-1">{v.material}</div>
                      <div className="mt-4 flex gap-3">
                        {["S", "M", "L"].map((s, i) => {
                          const caps = [v.capacity_s, v.capacity_m, v.capacity_l];
                          return (
                            <div key={s} className="flex-1">
                              <div className="h-1 bg-bronze/40 rounded-full overflow-hidden"><div className="h-full bg-gold" style={{ width: `${(caps[i] / 12) * 100}%` }} /></div>
                              <div className="font-ui text-[0.6rem] tracking-[0.2em] text-bronze mt-1">{s} · {caps[i]}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 font-display text-xl text-[#C4A35A]">{formatINR(v.price)}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="flex justify-end mt-10">
                <button data-testid="step-next" disabled={!vessel} onClick={next} className="btn-gold">Continue <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {step === 1.5 && (
            <div data-testid="step-budget" className="max-w-3xl mx-auto text-center">
              <div className="text-[0.7rem] tracking-[0.4em] text-bronze uppercase font-ui mb-3">Step Two</div>
              <h2 className="font-display text-5xl md:text-6xl text-ivory">Set Your <em className="italic text-[#C4A35A]">Gifting Budget</em></h2>
              <p className="font-body italic text-ivory/70 mt-4 text-lg">We will curate only what fits beautifully within your range.</p>
              <div className="mt-14">
                <div className="font-display text-6xl md:text-7xl text-[#C4A35A]">{formatINR(budget)}</div>
                <input
                  type="range" min={1500} max={30000} step={500} value={budget} onChange={(e) => setBudget(parseInt(e.target.value))}
                  data-testid="budget-slider"
                  className="w-full mt-8 accent-gold"
                />
                <div className="flex flex-wrap gap-3 justify-center mt-8">
                  {[2500, 5000, 8000, 12000, 18000, 25000].map((p) => (
                    <button key={p} onClick={() => setBudget(p)} data-testid={`budget-${p}`} className={`pill ${budget === p ? "pill-active" : ""}`}>{formatINR(p)}</button>
                  ))}
                </div>
                <p className="font-body italic text-ivory/60 mt-10">Approx. {Math.max(3, Math.floor(budget / 1000))}–{Math.max(5, Math.floor(budget / 700))} confections within this range.</p>
              </div>
              <div className="flex justify-between mt-12">
                <button onClick={back} className="btn-outline-gold"><ArrowLeft size={14} /> Back</button>
                <button onClick={next} className="btn-gold">Continue <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div data-testid="step-confections">
              <div className="text-center mb-10">
                <div className="text-[0.7rem] tracking-[0.4em] text-bronze uppercase font-ui mb-3">Step Three</div>
                <h2 className="font-display text-5xl md:text-6xl text-ivory">Fill It with <em className="italic text-[#C4A35A]">Desire</em></h2>
                <p className="font-body italic text-ivory/70 mt-4 text-lg">All confections are imported and curated exclusively for this collection.</p>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-none mb-8 justify-center">
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setCat(c.id)} data-testid={`cat-${c.id}`} className={`pill ${cat === c.id ? "pill-active" : ""}`}>{c.label}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pb-28">
                {filteredProducts.map((p) => {
                  const selected = !!selectedItems.find((i) => i.id === p.id);
                  const overBudget = runningTotal() + p.price > budget;
                  return (
                    <motion.button
                      key={p.id}
                      whileHover={{ y: -4 }}
                      onClick={() => toggleItem(p)}
                      data-testid={`product-${p.id}`}
                      className={`card-lux !p-0 text-left relative ${selected ? "ring-2 ring-gold glow-gold-strong" : ""} ${overBudget && !selected ? "opacity-50" : ""}`}
                    >
                      <div className="relative h-40 overflow-hidden">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        {selected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gold flex items-center justify-center"><Check size={16} className="text-walnut" /></motion.div>
                        )}
                        {overBudget && !selected && (
                          <div className="absolute inset-0 bg-obsidian/60 flex items-center justify-center">
                            <Lock className="text-gold" size={22} />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-ui text-sm text-ivory group-hover:text-[#C4A35A]">{p.name}</div>
                        <div className="font-body italic text-[0.72rem] text-bronze mt-1">{p.country}</div>
                        <div className="font-display text-lg text-[#C4A35A] mt-2">{formatINR(p.price)}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Fixed bottom summary */}
              <div className="fixed bottom-0 left-0 right-0 z-40 glass-dark border-t border-gold/30">
                <div className="lux-container flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="flex gap-6 font-ui text-[0.7rem] tracking-[0.2em] uppercase text-ivory/70">
                    <div><span className="text-[#C4A35A] text-base block">{selectedItems.length}</span>Items</div>
                    <div><span className="text-[#C4A35A] text-base block">{formatINR(total)}</span>Total</div>
                    <div><span className="text-[#C4A35A] text-base block">{weight}g</span>Weight</div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={back} className="btn-outline-gold"><ArrowLeft size={14} /> Back</button>
                    <button data-testid="confections-continue" disabled={selectedItems.length < 3} onClick={next} className="btn-gold">Continue <ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2.5 && (
            <div data-testid="step-gift-card" className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <div className="text-[0.7rem] tracking-[0.4em] text-bronze uppercase font-ui mb-3">Step Four</div>
                <h2 className="font-display text-5xl md:text-6xl text-ivory">Shall We Add a <em className="italic text-[#C4A35A]">Word?</em></h2>
                <p className="font-body italic text-ivory/70 mt-4 text-lg">A handwritten card, included with your hamper — complimentary.</p>
              </div>
              <div className="flex gap-3 justify-center mb-10">
                <button data-testid="gc-enable" onClick={() => setGiftCard({ enabled: true })} className={`pill ${giftCard.enabled ? "pill-active" : ""}`}>Yes, add a card</button>
                <button data-testid="gc-skip" onClick={() => setGiftCard({ enabled: false })} className={`pill ${!giftCard.enabled ? "pill-active" : ""}`}>Skip for now</button>
              </div>
              {giftCard.enabled && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-[0.3em] text-bronze font-ui mb-3">Occasion</div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {OCCASION_TILES.map((o) => (
                        <button key={o.id} onClick={() => setGiftCard({ occasion: o.id, message: o.templates[0] })} className={`pill ${giftCard.occasion === o.id ? "pill-active" : ""}`} data-testid={`gc-occ-${o.id}`}>{o.label}</button>
                      ))}
                    </div>
                    {giftCard.occasion && (
                      <>
                        <div className="text-[0.7rem] uppercase tracking-[0.3em] text-bronze font-ui mb-3">Suggested Messages</div>
                        <div className="space-y-3">
                          {(OCCASION_TILES.find((o) => o.id === giftCard.occasion)?.templates || []).map((t, i) => (
                            <button key={i} onClick={() => setGiftCard({ message: t })} className="w-full text-left card-lux !p-4 text-ivory/80 font-body italic hover:text-[#C4A35A]">{t}</button>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="mt-6">
                      <label className="lux-label">Personal message (max 150 chars)</label>
                      <textarea rows={4} maxLength={150} value={giftCard.message} onChange={(e) => setGiftCard({ message: e.target.value })} className="lux-input resize-none" data-testid="gc-message" />
                      <label className="lux-label mt-4">Recipient name</label>
                      <input className="lux-input" value={giftCard.recipient} onChange={(e) => setGiftCard({ recipient: e.target.value })} data-testid="gc-recipient" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <motion.div
                      initial={{ rotateY: 0 }} animate={{ rotateY: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity }}
                      className="w-[320px] h-[440px] bg-ceramic border border-gold/50 p-10 flex flex-col items-center justify-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                      data-testid="gc-preview"
                    >
                      <div className="font-ui text-[0.6rem] tracking-[0.4em] text-berry uppercase">Da Fruito</div>
                      <div className="hr-gold w-16 my-4" />
                      {giftCard.recipient && <div className="font-display italic text-2xl text-walnut mb-4">To, {giftCard.recipient}</div>}
                      <div className="font-script text-2xl text-walnut leading-snug whitespace-pre-wrap">{giftCard.message || "Your handwritten words will appear here."}</div>
                      <div className="mt-auto pt-6 font-body italic text-walnut/60 text-xs">With love, from our atelier.</div>
                    </motion.div>
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-14">
                <button onClick={back} className="btn-outline-gold"><ArrowLeft size={14} /> Back</button>
                <button onClick={next} className="btn-gold">Continue <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div data-testid="step-preview" className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-[0.7rem] tracking-[0.4em] text-bronze uppercase font-ui mb-3">Step Five</div>
                <h2 className="font-display text-5xl md:text-6xl text-ivory">A Glimpse of Your <em className="italic text-[#C4A35A]">Masterpiece</em></h2>
              </div>

              {/* Clean image-loading bar (replaces prior branded animation per user request) */}
              {(loadingImg || !previewImage) && (
                <div className="min-h-[260px] flex items-center justify-center py-14">
                  <ComposingBar active={loadingImg || !previewImage} />
                </div>
              )}

              {previewImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, filter: "blur(12px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 1.0, ease: [0.22,1,0.36,1] }}
                  className="mt-4 relative text-center"
                >
                  <div className="absolute -inset-8 bg-gold/10 blur-3xl rounded-full pointer-events-none" />
                  <img src={previewImage} alt="Your bespoke hamper" className="relative mx-auto max-h-[540px] object-contain border border-gold/30 rounded-xl" data-testid="preview-image" />
                  <p className="font-display italic text-ivory/70 mt-4">Your bespoke hamper, as it will be delivered.</p>
                </motion.div>
              )}

              <div className="flex flex-wrap gap-3 items-center justify-between mt-10">
                <button onClick={back} className="btn-outline-gold" data-testid="preview-back"><ArrowLeft size={14} /> Back</button>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => { setStep(2); setPreviewImage(null); }}
                    className="btn-outline-gold"
                    data-testid="redesign"
                  >Redesign Hamper</button>
                  <button
                    onClick={() => { reset(); setStep(1); }}
                    className="btn-outline-gold"
                    data-testid="create-another"
                  >Create Another Hamper</button>
                  <button onClick={next} className="btn-gold" data-testid="confirm-proceed" disabled={!previewImage}>Confirm & Proceed <ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div data-testid="step-details" className="grid lg:grid-cols-[1.15fr_1fr] gap-12">
              <div>
                <div className="mb-8">
                  <div className="text-[0.7rem] tracking-[0.4em] text-bronze uppercase font-ui mb-3">Final Step</div>
                  <h2 className="font-display text-5xl text-ivory">Almost <em className="italic text-[#C4A35A]">There</em></h2>
                  <p className="font-body italic text-ivory/70 mt-3">Your hamper is ready to be composed. Let us know where to send it.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="lux-label">Your Name*</label><input className="lux-input" value={details.sender_name} onChange={(e) => setDetails({ ...details, sender_name: e.target.value })} data-testid="d-sender" /></div>
                  <div><label className="lux-label">Recipient Name*</label><input className="lux-input" value={details.recipient_name} onChange={(e) => setDetails({ ...details, recipient_name: e.target.value })} data-testid="d-recipient" /></div>
                  <div><label className="lux-label">Contact Number*</label><input className="lux-input" value={details.contact} onChange={(e) => setDetails({ ...details, contact: e.target.value })} data-testid="d-contact" placeholder="+91 98XXX XXXXX" /></div>
                  <div><label className="lux-label">Occasion</label><input className="lux-input" value={details.occasion} onChange={(e) => setDetails({ ...details, occasion: e.target.value })} data-testid="d-occasion" /></div>
                  <div className="md:col-span-2"><label className="lux-label">Delivery Address*</label><textarea rows={3} className="lux-input" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} data-testid="d-address" /></div>
                  <div><label className="lux-label">Delivery Date</label><input type="date" className="lux-input" value={details.delivery_date} onChange={(e) => setDetails({ ...details, delivery_date: e.target.value })} data-testid="d-date" /></div>
                  <div><label className="lux-label">Special Instructions</label><input className="lux-input" value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} data-testid="d-notes" /></div>
                </div>
                <div className="mt-10 grid md:grid-cols-2 gap-3">
                  <button onClick={addBespokeToCart} className="btn-outline-gold" data-testid="action-add-cart"><Package2 size={16} /> Add to Cart</button>
                  <a href={whatsappCompose()} target="_blank" rel="noreferrer" className="btn-outline-gold" data-testid="action-whatsapp"><Heart size={16} /> Order via WhatsApp</a>
                  <button onClick={() => placeOrder("razorpay")} className="btn-gold" data-testid="action-razorpay"><Sparkles size={16} /> Pay via Razorpay</button>
                  <button onClick={() => placeOrder("cod")} className="btn-outline-gold" data-testid="action-cod">Cash on Delivery</button>
                </div>
                <div className="mt-8 flex flex-wrap gap-3 items-center justify-between border-t border-[#C8DEDD] pt-6">
                  <button onClick={back} className="btn-outline-gold" data-testid="details-back"><ArrowLeft size={14} /> Back to Preview</button>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setStep(2)} className="btn-ghost-warm" data-testid="details-redesign">Redesign Hamper</button>
                    <button onClick={() => { reset(); setStep(1); }} className="btn-ghost-warm" data-testid="details-create-another">Create Another Hamper</button>
                  </div>
                </div>
              </div>
              <div className="card-lux p-6 h-fit sticky top-28">
                <div className="text-[0.7rem] tracking-[0.3em] text-bronze uppercase font-ui mb-3">Order Summary</div>
                {previewImage && <img src={previewImage} alt="preview" className="w-full h-52 object-contain bg-[#EEF5F4] rounded-xl mb-4" />}
                <div className="font-display text-2xl text-ivory mb-1">{vessel?.name}</div>
                <div className="font-ui text-[0.65rem] uppercase tracking-[0.25em] text-bronze">{vessel?.material}</div>
                <div className="hr-gold my-4" />
                <div className="space-y-2 font-body text-ivory/80 max-h-60 overflow-y-auto pr-2">
                  {selectedItems.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm"><span>— {i.name}</span><span className="text-[#C4A35A]">{formatINR(i.price)}</span></div>
                  ))}
                </div>
                <div className="hr-gold my-4" />
                {giftCard.enabled && <div className="font-body italic text-ivory/70 text-sm mb-3">Includes handwritten card.</div>}
                <div className="flex justify-between font-ui uppercase tracking-[0.2em] text-ivory text-xs"><span>Budget</span><span>{formatINR(budget)}</span></div>
                <div className="flex justify-between font-display text-[#C4A35A] text-2xl mt-2"><span>Total</span><span>{formatINR(total)}</span></div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
