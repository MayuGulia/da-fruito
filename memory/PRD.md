# Da Fruito — PRD

## Problem Statement
Build a production-grade luxury hamper e-commerce website called "Da Fruito" following the uploaded PDF spec. Editorial luxury gifting brand for Delhi & NCR with premade hampers, bespoke 5-step builder, AI gifting curator, admin panel with AI inventory manager, Razorpay + COD + WhatsApp ordering.

## Architecture
- **Frontend**: React 19 (CRA) + Tailwind + Framer Motion + Zustand + Shadcn UI (sonner toasts)
- **Backend**: FastAPI + MongoDB (Motor) + JWT auth (bcrypt) + Emergent Universal LLM Key
- **AI**: Gemini 2.5 Pro (chat via emergentintegrations), Gemini 3.1 Flash Image (hamper previews via emergentintegrations)
- **Payments**: Razorpay (mock mode — signature-verified flow ready) + COD + WhatsApp wa.me
- **Design System**: "Natural Gold" — #1B1810 walnut, #C9A84C gold, #E8C97A antique, Cormorant Garamond + EB Garamond + Josefin Sans + Pinyon Script

## User Personas
1. **Gifter** (Delhi/NCR) — browses signature collections, uses bespoke builder, pays via UPI/COD
2. **Gift recipient** — receives the hamper with handwritten Pinyon-script card
3. **Admin (owner)** — manages orders, applies AI inventory commands, updates stock

## What's Implemented (2026-02)
- Routes: `/`, `/create-hamper`, `/cart`, `/checkout`, `/account`, `/admin`
- Homepage: Preloader (cinematic ribbon + bow + letter-by-letter), Navbar (transparent→walnut, mega dropdown), 100vh parallax Hero, Value Strip (4 pillars), Signature Collections (occasion pills + modal), Materials draggable carousel with gold particles, About editorial split, Instagram marquee, rotating Testimonials, WhatsApp-first Contact, 3-column Footer
- 5-step Bespoke Builder with cinematic 9-frame assembly animation + live Gemini image preview
- Floating AI Assistant (Gemini 2.5 Pro) with quick-reply chips
- Floating WhatsApp (wa.me)
- Admin Dashboard: revenue widgets, AI Inventory Manager (preview→apply with audit log), orders table with status pipeline, products grid
- Auth: email/password + JWT, first user auto-admin
- Cart: bespoke hampers stored as single cart entity with metadata + AI preview image
- Razorpay arch with HMAC SHA256 verification (mock when keys absent)

## Test Results (Iteration 1)
- Backend: 100% (34/34 tests passed)
- Frontend: 95% (1 minor broken image — fixed)

## Env placeholders
- `EMERGENT_LLM_KEY`, `JWT_SECRET`, `WHATSAPP_NUMBER`, `RAZORPAY_KEY_ID/SECRET`

## Seed Data
- 6 vessels, 20 products (7 categories), 6 signature hampers, 1 admin user (admin@dafruito.com / admin123)

## Backlog
- P1: Excel/SheetJS bulk product import
- P1: Saved addresses in /account
- P1: Order export CSV from admin
- P2: Google OAuth (Emergent-managed)
- P2: Cloudinary image CDN
- P2: Real Razorpay keys (when provided)
- P2: Sentry error tracking
