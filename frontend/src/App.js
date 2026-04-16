import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { PreloaderGate } from "./components/Preloader";
import AIAssistant from "./components/AIAssistant";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import Home from "./pages/Home";
import CreateHamper from "./pages/CreateHamper";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import { useAuthStore } from "./store/authStore";
import { useCartStore } from "./store/cartStore";

const ScrollToTop = () => {
  const loc = useLocation();
  useEffect(() => {
    if (!loc.hash) window.scrollTo({ top: 0, behavior: "instant" });
    else {
      const el = document.querySelector(loc.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 60);
    }
  }, [loc.pathname, loc.hash]);
  return null;
};

function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const fetchCart = useCartStore((s) => s.fetch);

  useEffect(() => {
    fetchMe().then((u) => { if (u) fetchCart(); });
  }, [fetchMe, fetchCart]);

  return (
    <div className="App">
      <BrowserRouter>
        <PreloaderGate>
          <ScrollToTop />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-hamper" element={<CreateHamper />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Footer />
          <AIAssistant />
          <FloatingWhatsApp />
          <Toaster position="top-center" theme="dark" toastOptions={{
            style: { background: "#231F17", border: "1px solid rgba(201,168,76,0.35)", color: "#F5EDD6", fontFamily: "EB Garamond, serif" },
          }} />
        </PreloaderGate>
      </BrowserRouter>
    </div>
  );
}

export default App;
