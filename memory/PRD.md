# Da Fruito — PRD

## Problem Statement
Build a production-grade luxury hamper e-commerce website called "Da Fruito" following the uploaded PDF spec. Editorial luxury gifting brand for Delhi & NCR with premade hampers, bespoke 5-step builder, AI gifting curator, admin panel with AI inventory manager, Razorpay + COD + WhatsApp ordering.

## Architecture
- **Frontend**: React 19 (CRA) + Tailwind + Framer Motion + Zustand + Shadcn UI (sonner toasts)
- **Backend**: FastAPI + MongoDB (Motor) + Firebase Auth (JWKS-verified) + legacy bcrypt/JWT + Emergent Universal LLM Key
- **AI**: Gemini 2.5 Pro (chat via emergentintegrations), Gemini 3.1 Flash Image (hamper previews)
- **Payments**: Razorpay (MOCKED — signature-verified flow ready) + COD + WhatsApp wa.me
- **Design System**: "Teal Atelier v5.0" — #1A2E2E deep teal, #2A7E7C atelier teal, #E6F4F3 mint, #C4A35A heritage gold + Italiana editorial headline font

## User Personas
1. **Gifter** (Delhi/NCR) — browses signature collections, uses bespoke builder, pays via UPI/COD
2. **Gift recipient** — receives the hamper with handwritten Pinyon-script card
3. **Admin (owner)** — manages orders, applies AI inventory commands, updates stock

## What's Implemented (through 2026-02)
### Routes
`/`, `/create-hamper`, `/cart`, `/checkout`, `/account`, `/admin`

### Homepage sections (current v5.0 state)
- **Preloader** — Da Fruito logo (SVG arc + leaf) + wordmark letter-reveal + tagline (updated 2026-02)
- **Navbar** — enlarged (py-6/md:py-7, logo 48×30, wordmark 34px), opaque white, mega dropdown
- **Announcement Bar** — marquee teal
- **100vh Hero** — luxury hamper cover (customer-supplied), left-aligned Italiana headline
- **Value Strip** — 4 teal circular trust badges
- **Featured Hampers** — horizontal-scroll bestsellers
- **Collections** — 6 occasion tiles → filter view with modal
- **Materials** — draggable carousel
- **About** — editorial split layout
- **Testimonials** — auto-rotating quotes
- **As Seen In** — press marquee
- **Instagram strip** — wired to @da.fruito
- **Contact** — WhatsApp green CTA (+91 90347 82090) + phone/email/IG
- **Footer** — 4-column, owner-access admin shortcut

### Builder / Admin
- 5-step Bespoke Builder with 9-frame cinematic assembly + Gemini live image preview
- Floating AI Assistant (Gemini)
- Floating WhatsApp
- Admin Dashboard: revenue widgets, AI Inventory Manager, orders pipeline, product grid

### Auth
- **Firebase (primary)**: email/password + Google popup → `/api/auth/firebase-sync` JWKS-verified → backend JWT
- **Legacy JWT (secondary)**: bcrypt at `/api/auth/register` and `/api/auth/login`
- First Firebase user OR email in `ADMIN_EMAILS` auto-becomes admin

### Data
- 6 vessels, **50 products across 6 clean categories** (chocolates:7, biscuits:3, nuts:10, teas:10, snacks:10, artisan:10)
- 6 signature hampers (one per occasion)
- Every product has a unique, verified-loading Unsplash image (no 404s)

## Recent Fixes (2026-02-18)
| Fix | Detail |
|---|---|
| Preloader | Now shows Da Fruito brand logo + wordmark + tagline |
| Navbar | Enlarged to py-6/7, logo SVG 48px, wordmark 34px |
| WhatsApp | `+91 90347 82090` across backend .env, api.js, Contact, Footer, FloatingWhatsApp |
| Instagram | Wired to `@da.fruito` (https://www.instagram.com/da.fruito/) |
| Confections | 6 clean category tabs, re-categorized 50 products; no empty tabs |
| Unique images | All 50 products + 6 hampers have unique verified Unsplash URLs |
| Hero cover | Customer-supplied luxury hamper image (teal ribbon, gold bow, marble case) |
| Collections tiles | On-brand gifting images matched to each occasion |

## Verification (iteration 2)
- Backend: **49/49** tests passed (100%)
- Frontend: **95%** — all 6 user-reported fixes verified
- Firebase auth: login verified working with `fbadmin1776506006@dafruito.com`

## Env / Configuration
- `EMERGENT_LLM_KEY`, `JWT_SECRET`, `WHATSAPP_NUMBER="+919034782090"`, `RAZORPAY_*` (empty = mock), `FIREBASE_PROJECT_ID=da-fruito-4c40c`, `ADMIN_EMAILS=mayu.gulia156@gmail.com`

## Backlog (priority order)
### P0 — Teal Atelier v5.0 (remaining)
- Artisan Story section (dark #1A2E2E split layout per PDF)
- Glimpses / Atelier Video section — embed @da.fruito IG reel `DLPey7GzkYH`
- Shop on Instagram grid — 4x2 tiles with teal hover linking to @da.fruito
- Builder progress nodes → final teal polish
- Admin sidebar → teal scheme

### P1
- Replace remaining stock images with real product photos (business to supply)
- Share feature for AI-generated bespoke compositions (public short-link)
- Excel/SheetJS bulk product import

### P2
- Razorpay real-keys configuration
- Email order confirmations (Resend integration)
