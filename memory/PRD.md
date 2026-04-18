# Da Fruito — PRD

## Problem Statement
Build a production-grade luxury hamper e-commerce website called "Da Fruito" following the uploaded PDF spec. Editorial luxury gifting brand for Delhi & NCR with premade hampers, bespoke 5-step builder, AI gifting curator, admin panel with AI inventory manager, Razorpay + COD + WhatsApp ordering.

## Architecture
- **Frontend**: React 19 (CRA) + Tailwind + Framer Motion + Zustand + Shadcn UI (sonner toasts)
- **Backend**: FastAPI + MongoDB (Motor) + Firebase Auth (JWKS-verified) + legacy bcrypt/JWT + Emergent Universal LLM Key
- **AI**: Gemini 2.5 Pro (chat), Gemini 3.1 Flash Image (hamper previews via emergentintegrations)
- **Payments**: Razorpay (MOCKED) + COD + WhatsApp wa.me
- **Design System**: "Teal Atelier v5.0" — #1A2E2E deep teal, #2A7E7C atelier teal, #E6F4F3 mint, #C4A35A heritage gold + Italiana editorial headline font

## User Personas
1. **Gifter** (Delhi/NCR) — browses signature collections, uses bespoke builder, pays via UPI/COD
2. **Gift recipient** — receives the hamper with handwritten Pinyon-script card
3. **Admin (owner)** — manages orders, applies AI inventory commands, updates stock

## What's Implemented (through 2026-02-18)

### Routes
`/`, `/create-hamper`, `/cart`, `/checkout`, `/account`, `/admin`

### Homepage (current order)
Hero → FeaturedHampers → ValueStrip → Collections → Materials → **ArtisanStory** → About → **Glimpses** → Testimonials → AsSeenIn → **ShopInstagram** → Contact

### Homepage sections
- **Preloader** — Da Fruito brand logo (SVG arc + leaf) + wordmark letter-reveal + tagline "The Art of Gifting, Perfected."
- **Navbar** — enlarged (py-6/md:py-7, logo 48×30, wordmark 34px), opaque white, mega dropdown
- **Announcement Bar** — marquee teal
- **100vh Hero** — customer-supplied luxury hamper cover, left-aligned Italiana headline + CTAs
- **Value Strip** — 4 teal circular trust badges
- **Featured Hampers** — horizontal-scroll bestsellers
- **Collections** — 6 occasion tiles → filter view with modal
- **Materials** — draggable carousel
- **ArtisanStory** — dark #1A2E2E split, editorial image + copy + MMXXIV heritage card + atelier signature (NEW)
- **About** — editorial split
- **Glimpses** — 3-column grid, center column embeds `@da.fruito` IG reel `DLPey7GzkYH` via iframe (NEW)
- **Testimonials** — auto-rotating quotes
- **As Seen In** — press marquee
- **ShopInstagram** — 4x2 grid, 8 tiles with teal hover wash linking to `@da.fruito` (NEW)
- **Contact** — WhatsApp green CTA (+91 90347 82090) + phone/email/IG
- **Footer** — 4-column, owner-access admin shortcut

### Bespoke Builder — Create Hamper (6 steps)
1. Vessel · 1.5. Budget · 2. Confections (6 categories, 50 products) · 2.5. Gift Card · 3. Preview · 4. Details

**Preview step (step 3)**: Clean teal→gold **ComposingBar** progress loader (replaces prior ribbon/bow AssemblyAnimation). Four action buttons: **Back**, **Redesign Hamper** (→ step 2, preserves vessel), **Create Another Hamper** (full reset → step 1), **Confirm & Proceed**.
**Details step (step 4)**: Payment action buttons + **Back to Preview**, Redesign Hamper, Create Another Hamper.

### Auth
- **Firebase (primary)**: email/password + Google popup → `/api/auth/firebase-sync` JWKS-verified → backend JWT
- **Legacy JWT (secondary)**: bcrypt at `/api/auth/register` and `/api/auth/login`
- First Firebase user OR email in `ADMIN_EMAILS` auto-becomes admin

### Data
- 6 vessels, **50 products across 6 clean categories** (chocolates:7, biscuits:3, nuts:10, teas:10, snacks:10, artisan:10)
- 6 signature hampers (one per occasion)
- Every product + hamper has a unique, verified-loading Unsplash image

## Recent Fixes (2026-02-18)
| Iteration | Fix |
|---|---|
| 2 | Preloader logo; enlarged Navbar; WhatsApp +91 90347 82090; Instagram @da.fruito; 6 clean Confections categories; unique product images; new Hero cover image |
| 3 | ArtisanStory, Glimpses (IG reel), ShopInstagram sections added; Preview loader replaced with ComposingBar; Back/Redesign/Create-Another buttons added to Preview + Details |

## Verification Snapshots
- Iteration 1: Backend 34/34
- Iteration 2: Backend 49/49, Frontend 95% (6 user fixes verified)
- Iteration 3: Backend 15/15 smoke, Frontend 95% (all v5.0 features verified; 2 broken Unsplash URLs fixed after report)

## Env / Configuration
- `EMERGENT_LLM_KEY`, `JWT_SECRET`, `WHATSAPP_NUMBER="+919034782090"`, `RAZORPAY_*` (empty = mock), `FIREBASE_PROJECT_ID=da-fruito-4c40c`, `ADMIN_EMAILS=mayu.gulia156@gmail.com`

## Backlog
### P0
- Public share-link for AI-generated bespoke compositions (tap → opens preview publicly, shareable to WhatsApp/Instagram)

### P1
- Replace remaining stock images with real product photography (business to supply)
- Excel/SheetJS bulk product import
- Admin sidebar → full teal polish

### P2
- Razorpay real-keys configuration
- Email order confirmations (Resend integration)
- Builder progress nodes final teal refinement
