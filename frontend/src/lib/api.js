import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("dafruito_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const WHATSAPP_NUMBER_DEFAULT = "+919034782090";

export const buildWhatsAppLink = (number, message) => {
  const clean = String(number || WHATSAPP_NUMBER_DEFAULT).replace(/[^+\d]/g, "");
  const n = clean.startsWith("+") ? clean.slice(1) : clean;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
};
