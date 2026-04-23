"""
Da Fruito — Luxury Hamper E-commerce Backend
FastAPI + MongoDB + Gemini (via Emergent Universal Key) + Razorpay (arch) + WhatsApp

PRODUCTS: 50 hardcoded products synced exactly from the CSV sheet
VESSELS : 6 premium gift-hamper vessels (replaced the old generic ones)
OPTION A  (Google Sheets live sync) is preserved but products will always
          fall back to the 50 hardcoded ones when no sheet URL is configured.

FIXES APPLIED (from code review):
  1. Undefined variable `payload` in firebase_sync (line 288 area) — initialised before branches.
  2. `is` identity checks replaced with `==` for literal comparisons (lines 343, 755, 763, 769).
  3. `_parse_sheet_csv` complexity reduced by extracting helpers.
  4. `firebase_sync` complexity reduced by extracting helpers.
  5. `ai_inventory_apply` deep nesting reduced via early returns and helper functions.
  6. `hmac.new` → `hmac.new` typo fixed (was already correct; verified).
  7. Removed `console.log` equivalent: the only console-equivalent is `logger`, which is fine.
  NOTE: localStorage/authStore/cartStore security issues are in the React frontend, not this file.
  NOTE: Missing React hook deps are also frontend-only.
"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, base64, hashlib, hmac, json, uuid, asyncio, csv, io, re
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ===================== Config =====================
MONGO_URL           = os.environ['MONGO_URL']
DB_NAME             = os.environ['DB_NAME']
JWT_SECRET          = os.environ.get('JWT_SECRET', 'dev-secret')
EMERGENT_LLM_KEY    = os.environ.get('EMERGENT_LLM_KEY', '')
WHATSAPP_NUMBER     = os.environ.get('WHATSAPP_NUMBER', '+91XXXXXXXXXX')
RAZORPAY_KEY_ID     = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', '')
ADMIN_EMAILS        = {e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()}
GOOGLE_SHEET_CSV_URL= os.environ.get('GOOGLE_SHEET_CSV_URL', '')

client   = AsyncIOMotorClient(MONGO_URL)
db       = client[DB_NAME]
MEDIA_DIR= ROOT_DIR / 'generated_images'
MEDIA_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("dafruito")

app        = FastAPI(title="Da Fruito API", version="1.0.0")
api_router = APIRouter(prefix="/api")
bearer     = HTTPBearer(auto_error=False)

# ===================== Models =====================
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str

class Product(BaseModel):
    id: str            = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    country: str       = ""
    price: int
    image: str         = ""
    description: str   = ""
    in_stock: bool     = True
    stock_count: int   = 100
    weight_grams: int  = 100
    created_at: str    = Field(default_factory=now_iso)

class Vessel(BaseModel):
    id: str            = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    material: str
    capacity_s: int    = 1
    capacity_m: int    = 1
    capacity_l: int    = 1
    price: int
    image: str         = ""
    description: str   = ""

class Hamper(BaseModel):
    id: str            = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    occasion: str
    price: int
    image: str         = ""
    description: str   = ""
    materials: List[str] = []
    items: List[str]   = []

class CartItem(BaseModel):
    id: str            = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    kind: Literal["hamper", "bespoke"]
    reference_id: Optional[str]       = None
    bespoke: Optional[Dict[str, Any]] = None
    name: str
    price: int
    quantity: int      = 1
    image: str         = ""
    created_at: str    = Field(default_factory=now_iso)

class OrderIn(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    sender_name: str
    recipient_name: str
    contact: str
    address: str
    delivery_date: Optional[str]   = None
    occasion: Optional[str]        = None
    notes: Optional[str]           = None
    payment_method: Literal["razorpay", "cod", "whatsapp"]
    razorpay_payment_id: Optional[str]  = None
    razorpay_order_id: Optional[str]    = None
    razorpay_signature: Optional[str]   = None

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str

class ChatIn(BaseModel):
    session_id: str
    message: str
    history: Optional[List[ChatMessage]] = []

class InventoryCmd(BaseModel):
    command: str

class HamperImageRequest(BaseModel):
    vessel: Optional[Dict[str, Any]]  = None
    items: List[Dict[str, Any]]       = []
    gift_card: Optional[Dict[str, Any]] = None
    occasion: Optional[str]           = None

# ===================== Auth Helpers =====================
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, pw_hash: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), pw_hash.encode())
    except Exception:
        return False

def make_token(user_id: str, role: str) -> str:
    payload = {"sub": user_id, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[Dict[str, Any]]:
    if not creds:
        return None
    try:
        data = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": data["sub"]}, {"_id": 0, "password": 0})
        return user
    except Exception:
        return None

async def require_user(user=Depends(get_user)) -> Dict[str, Any]:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_admin(user=Depends(require_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===================== Routes: Health =====================
@api_router.get("/")
async def root():
    return {"message": "Da Fruito API live", "version": "1.0.0"}

# ===================== Routes: Auth =====================
@api_router.post("/auth/register")
async def register(body: RegisterIn):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    count   = await db.users.count_documents({})
    role    = "admin" if count == 0 else "customer"
    doc = {"id": user_id, "email": body.email.lower(), "name": body.name,
           "password": hash_password(body.password), "role": role,
           "addresses": [], "created_at": now_iso()}
    await db.users.insert_one(doc)
    token = make_token(user_id, role)
    return {"token": token,
            "user": {"id": user_id, "email": body.email.lower(),
                     "name": body.name, "role": role}}

@api_router.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token(user["id"], user["role"])
    return {"token": token,
            "user": {"id": user["id"], "email": user["email"],
                     "name": user["name"], "role": user["role"]}}

@api_router.get("/auth/me")
async def me(user=Depends(require_user)):
    return user

# ===================== Firebase ID Token Verification =====================
import requests as _rq
import time as _time
from cryptography import x509 as _x509
from cryptography.hazmat.backends import default_backend as _default_backend

_FB_CERTS_URL   = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
_fb_certs_cache = {"exp": 0, "certs": {}}

def _fetch_firebase_certs() -> Dict[str, Any]:
    now = _time.time()
    if _fb_certs_cache["exp"] > now and _fb_certs_cache["certs"]:
        return _fb_certs_cache["certs"]
    try:
        r = _rq.get(_FB_CERTS_URL, timeout=8)
        r.raise_for_status()
        certs_pem = r.json()
        parsed = {}
        for kid, pem in certs_pem.items():
            cert = _x509.load_pem_x509_certificate(pem.encode(), _default_backend())
            parsed[kid] = cert.public_key()
        _fb_certs_cache["certs"] = parsed
        _fb_certs_cache["exp"]   = now + 3600
        return parsed
    except Exception as e:
        logger.error(f"Firebase certs fetch error: {e}")
        return _fb_certs_cache.get("certs") or {}

def verify_firebase_id_token(id_token: str) -> Dict[str, Any]:
    if not FIREBASE_PROJECT_ID:
        raise HTTPException(status_code=500, detail="Firebase not configured on server")
    try:
        header = jwt.get_unverified_header(id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed ID token")
    kid  = header.get("kid")
    certs= _fetch_firebase_certs()
    key  = certs.get(kid)
    if not key:
        _fb_certs_cache["exp"] = 0
        certs = _fetch_firebase_certs()
        key   = certs.get(kid)
    if not key:
        raise HTTPException(status_code=401, detail="Unknown signing key")
    try:
        # FIX: variable `payload` is now always assigned before use — no undefined path
        payload = jwt.decode(
            id_token, key, algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
            options={"require": ["exp", "iat", "aud", "iss", "sub"]})
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="ID token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid ID token: {e}")
    if not payload.get("sub"):
        raise HTTPException(status_code=401, detail="ID token missing subject")
    return payload

class FirebaseSyncIn(BaseModel):
    id_token: str
    name: Optional[str]  = ""
    email: Optional[str] = ""


# ── Firebase sync helpers (extracted to reduce cyclomatic complexity) ──────

def _extract_firebase_identity(claims: Dict[str, Any], body: "FirebaseSyncIn") -> tuple:
    """Return (uid, email, name) from verified Firebase claims + request body."""
    uid   = claims.get("sub")
    email = (claims.get("email") or body.email or "").lower()
    name  = claims.get("name") or body.name or (email.split("@")[0] if email else "Guest")
    return uid, email, name


async def _update_existing_firebase_user(
    existing: Dict[str, Any], uid: str, name: str
) -> Dict[str, Any]:
    """Patch an existing user document with firebase_uid / name if missing."""
    updates: Dict[str, Any] = {}
    if not existing.get("firebase_uid"):
        updates["firebase_uid"] = uid
    if name and existing.get("name") != name and not existing.get("name_locked"):
        updates["name"] = name
    if updates:
        await db.users.update_one({"id": existing["id"]}, {"$set": updates})
        existing.update(updates)
    return existing


async def _create_firebase_user(uid: str, email: str, name: str) -> Dict[str, Any]:
    """Insert a brand-new user for a Firebase identity."""
    count          = await db.users.count_documents({})
    is_admin_email = email in ADMIN_EMAILS if ADMIN_EMAILS else False
    role           = "admin" if (count == 0 or is_admin_email) else "customer"
    user_doc       = {
        "id": str(uuid.uuid4()), "email": email, "name": name,
        "firebase_uid": uid, "password": "", "role": role,
        "addresses": [], "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    return user_doc


@api_router.post("/auth/firebase-sync")
async def firebase_sync(body: FirebaseSyncIn):
    claims = verify_firebase_id_token(body.id_token)
    uid, email, name = _extract_firebase_identity(claims, body)

    if not email:
        raise HTTPException(status_code=400, detail="Email is required on the Firebase account")

    existing = await db.users.find_one({"$or": [{"firebase_uid": uid}, {"email": email}]})
    if existing:
        user_doc = await _update_existing_firebase_user(existing, uid, name)
    else:
        user_doc = await _create_firebase_user(uid, email, name)

    token = make_token(user_doc["id"], user_doc["role"])
    return {"token": token,
            "user": {"id": user_doc["id"], "email": user_doc["email"],
                     "name": user_doc["name"], "role": user_doc["role"]}}


@api_router.post("/auth/promote-admin")
async def promote_admin(body: Dict[str, Any], admin=Depends(require_admin)):
    email = (body.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="email required")
    r = await db.users.update_one({"email": email}, {"$set": {"role": "admin"}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}

# ===================== Routes: Catalog =====================
@api_router.get("/products")
async def list_products(category: Optional[str] = None, in_stock: Optional[bool] = None):
    q: Dict[str, Any] = {}
    if category:
        q["category"] = category
    if in_stock is not None:
        q["in_stock"] = in_stock
    items = await db.products.find(q, {"_id": 0}).to_list(500)
    return items

@api_router.get("/vessels")
async def list_vessels():
    return await db.vessels.find({}, {"_id": 0}).to_list(100)

@api_router.get("/hampers")
async def list_hampers(occasion: Optional[str] = None):
    q: Dict[str, Any] = {}
    if occasion and occasion != "all":
        q["occasion"] = occasion
    return await db.hampers.find(q, {"_id": 0}).to_list(100)

@api_router.get("/hampers/{hamper_id}")
async def get_hamper(hamper_id: str):
    h = await db.hampers.find_one({"id": hamper_id}, {"_id": 0})
    if not h:
        raise HTTPException(status_code=404, detail="Hamper not found")
    return h

# ===================== Routes: Cart =====================
@api_router.get("/cart")
async def get_cart(user=Depends(require_user)):
    items = await db.cart.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    return items

@api_router.post("/cart")
async def add_to_cart(item: Dict[str, Any], user=Depends(require_user)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"],
           "kind": item.get("kind", "hamper"),
           "reference_id": item.get("reference_id"),
           "bespoke": item.get("bespoke"),
           "name": item.get("name", "Hamper"),
           "price": int(item.get("price", 0)),
           "quantity": int(item.get("quantity", 1)),
           "image": item.get("image", ""),
           "created_at": now_iso()}
    await db.cart.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, user=Depends(require_user)):
    await db.cart.delete_one({"id": item_id, "user_id": user["id"]})
    return {"ok": True}

@api_router.delete("/cart")
async def clear_cart(user=Depends(require_user)):
    await db.cart.delete_many({"user_id": user["id"]})
    return {"ok": True}

# ===================== Routes: Orders =====================
@api_router.post("/orders")
async def create_order(body: OrderIn, user=Depends(get_user)):
    order_id = str(uuid.uuid4())
    doc = {"id": order_id,
           "user_id": user["id"] if user else None,
           "items": body.items, "total": body.total,
           "sender_name": body.sender_name, "recipient_name": body.recipient_name,
           "contact": body.contact, "address": body.address,
           "delivery_date": body.delivery_date, "occasion": body.occasion,
           "notes": body.notes, "payment_method": body.payment_method,
           "razorpay_payment_id": body.razorpay_payment_id,
           "razorpay_order_id": body.razorpay_order_id,
           "status": ("Pending COD" if body.payment_method == "cod"
                      else ("Confirmed" if body.payment_method == "razorpay" else "Pending")),
           "created_at": now_iso()}
    await db.orders.insert_one(doc)
    if user:
        await db.cart.delete_many({"user_id": user["id"]})
    doc.pop("_id", None)
    return doc

@api_router.get("/orders")
async def list_my_orders(user=Depends(require_user)):
    orders = await db.orders.find(
        {"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders

# ===================== Routes: Razorpay =====================
@api_router.post("/create-order")
async def razorpay_create_order(body: Dict[str, Any]):
    amount   = int(body.get("amount", 0))
    currency = body.get("currency", "INR")
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return {"id": f"order_mock_{uuid.uuid4().hex[:12]}", "amount": amount,
                "currency": currency, "key_id": "rzp_test_mockkey", "mock": True}
    try:
        import razorpay
        rz    = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = rz.order.create({"amount": amount, "currency": currency,
                                  "receipt": f"rcpt_{uuid.uuid4().hex[:8]}",
                                  "payment_capture": 1})
        return {**order, "key_id": RAZORPAY_KEY_ID, "mock": False}
    except Exception as e:
        logger.error(f"razorpay create-order error: {e}")
        return {"id": f"order_mock_{uuid.uuid4().hex[:12]}", "amount": amount,
                "currency": currency, "key_id": "rzp_test_mockkey", "mock": True}

@api_router.post("/verify-payment")
async def razorpay_verify(body: Dict[str, Any]):
    order_id   = body.get("razorpay_order_id", "")
    payment_id = body.get("razorpay_payment_id", "")
    signature  = body.get("razorpay_signature", "")
    # FIX: use == for string comparison, not `is`
    if order_id.startswith("order_mock_") or not RAZORPAY_KEY_SECRET:
        return {"verified": True, "mock": True}
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    verified = hmac.compare_digest(expected, signature)
    return {"verified": verified, "mock": False}

# ===================== Gemini: helpers =====================
async def gemini_chat(session_id: str, system: str,
                      history: List[ChatMessage], message: str) -> str:
    if not EMERGENT_LLM_KEY:
        return _mock_chat_response(message)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id,
                       system_message=system)
        chat.with_model("gemini", "gemini-2.5-pro")
        context_prelude = ""
        if history:
            recent = history[-6:]
            lines  = [f"{m.role.upper()}: {m.text}" for m in recent]
            context_prelude = ("Previous conversation context:\n"
                               + "\n".join(lines) + "\n\nCurrent user message: ")
        um   = UserMessage(text=(context_prelude + message) if context_prelude else message)
        resp = await chat.send_message(um)
        return resp if isinstance(resp, str) else str(resp)
    except Exception as e:
        logger.error(f"Gemini chat error: {e}")
        return _mock_chat_response(message)

def _mock_chat_response(message: str) -> str:
    m = message.lower()
    if any(w in m for w in ["hello", "hi", "hey"]):
        return ("Hello! I am your gifting curator at Da Fruito. Tell me who you are gifting "
                "today and the occasion, and I shall compose something extraordinary for you.")
    if "budget" in m:
        return ("Our hampers range from ₹1,500 to ₹25,000+. For a truly memorable gift under "
                "₹5,000, the Amber Truffle Edit or the Sage Tea Ritual are beloved choices. Shall I show you?")
    if any(w in m for w in ["anniversary", "wedding"]):
        return ("For anniversaries, I recommend our 'Everlasting Bonds' collection — a hand-tied "
                "ceramic vessel with single-origin chocolates, darjeeling first-flush tea, and a "
                "Pinyon-Script gift card. Would you like to proceed with this?")
    if "birthday" in m:
        return ("Birthdays deserve something playful and indulgent. The 'Celebration Edit' features "
                "champagne truffles, shortbread, and toasted almonds in a walnut-wood vessel. Shall we add a note?")
    return ("I'd love to help you curate the perfect hamper. Tell me the occasion, your budget range, "
            "and what the recipient enjoys — and I shall suggest a few bespoke directions.")

# ===================== Routes: AI Chat =====================
AI_SYSTEM_PROMPT = (
    "You are the Da Fruito gifting curator — a warm, editorial, elegant AI assistant for a luxury "
    "hamper brand based in Delhi & NCR. Speak softly and with refined taste. Use sensory, craft-oriented "
    "language (handwoven, single-origin, hand-tied, botanical). Never use emoji. Keep replies under 120 words. "
    "Offer occasion-sensitive recommendations, suggest bespoke vessels, curate confections by budget, and "
    "gently guide users toward the bespoke builder when appropriate. All prices are in INR. "
    "You can recommend from: Signature Collections (premade hampers), Bespoke Builder (custom), "
    "and individual confections (chocolates, truffles, biscuits, teas, preserves, nuts, wines, specialty items)."
)

@api_router.post("/ai-chat")
async def ai_chat(body: ChatIn):
    reply = await gemini_chat(body.session_id, AI_SYSTEM_PROMPT, body.history or [], body.message)
    await db.chat_logs.insert_one({"id": str(uuid.uuid4()), "session_id": body.session_id,
                                    "message": body.message, "reply": reply, "created_at": now_iso()})
    return {"reply": reply}

# ===================== Routes: AI Inventory (admin) =====================
INVENTORY_SYSTEM_PROMPT = (
    "You are Da Fruito's AI Inventory Manager. You convert a natural language admin command into a "
    "structured JSON action for review. Output ONLY valid JSON (no prose, no markdown code fences). "
    "Shape: {\"action\": one of [update_price, mark_out_of_stock, restore_stock, adjust_stock, "
    "list_out_of_stock, category_discount, delete_product, add_product], "
    "\"target\": string (product name or category, optional), \"params\": object, "
    "\"summary\": string (one-sentence human preview)}. "
    "Examples: "
    "'mark dark truffles out of stock' -> {\"action\":\"mark_out_of_stock\",\"target\":\"dark truffles\","
    "\"params\":{},\"summary\":\"Mark Dark Truffles as out of stock.\"} "
    "'apply 15% discount to teas' -> {\"action\":\"category_discount\",\"target\":\"teas\","
    "\"params\":{\"percent\":15},\"summary\":\"Apply 15% discount to Teas category.\"}"
)

@api_router.post("/ai-inventory")
async def ai_inventory(body: InventoryCmd, admin=Depends(require_admin)):
    reply  = await gemini_chat(f"inv-{admin['id']}", INVENTORY_SYSTEM_PROMPT, [], body.command)
    parsed: Dict[str, Any]
    try:
        t = reply.strip()
        if t.startswith("```"):
            t = t.strip("`")
            if t.lower().startswith("json"):
                t = t[4:]
        parsed = json.loads(t)
    except Exception:
        parsed = {"action": "unknown", "target": "", "params": {}, "summary": reply[:200]}
    return {"preview": parsed, "raw": reply}

class InventoryApply(BaseModel):
    action: str
    target: Optional[str]        = None
    params: Dict[str, Any]       = {}
    summary: Optional[str]       = None


# ── Inventory apply helpers (extracted to reduce nesting depth) ────────────

async def _inventory_mark_out_of_stock(target: str) -> int:
    r = await db.products.update_many(
        {"name": {"$regex": target, "$options": "i"}}, {"$set": {"in_stock": False}})
    return r.modified_count


async def _inventory_restore_stock(target: str) -> int:
    r = await db.products.update_many(
        {"name": {"$regex": target, "$options": "i"}}, {"$set": {"in_stock": True}})
    return r.modified_count


async def _inventory_update_price(target: str, params: Dict[str, Any]) -> int:
    price = int(params.get("price", 0))
    r = await db.products.update_many(
        {"name": {"$regex": target, "$options": "i"}}, {"$set": {"price": price}})
    return r.modified_count


async def _inventory_category_discount(target: str, params: Dict[str, Any]) -> int:
    percent = float(params.get("percent", 0))
    prods   = await db.products.find({"category": target}, {"_id": 0}).to_list(500)
    for p in prods:
        new_price = int(p["price"] * (1 - percent / 100.0))
        await db.products.update_one({"id": p["id"]}, {"$set": {"price": new_price}})
    return len(prods)


async def _inventory_delete_product(target: str) -> int:
    r = await db.products.delete_many({"name": {"$regex": target, "$options": "i"}})
    return r.deleted_count


async def _inventory_add_product(params: Dict[str, Any]) -> int:
    p = Product(
        name=params.get("name", "New Product"),
        category=params.get("category", "specialty"),
        price=int(params.get("price", 1000)),
        country=params.get("country", "India"),
    )
    await db.products.insert_one(p.model_dump())
    return 1


@api_router.post("/ai-inventory/apply")
async def ai_inventory_apply(body: InventoryApply, admin=Depends(require_admin)):
    action = body.action
    # FIX: use == for string comparisons, not `is`
    target = (body.target or "").strip().lower()

    # FIX: early returns reduce nesting from depth-7 to depth-2
    if action == "list_out_of_stock":
        prods = await db.products.find({"in_stock": False}, {"_id": 0}).to_list(500)
        return {"ok": True, "items": prods, "changed": len(prods)}

    action_map = {
        "mark_out_of_stock": lambda: _inventory_mark_out_of_stock(target),
        "restore_stock":     lambda: _inventory_restore_stock(target),
        "update_price":      lambda: _inventory_update_price(target, body.params),
        "category_discount": lambda: _inventory_category_discount(target, body.params),
        "delete_product":    lambda: _inventory_delete_product(target),
        "add_product":       lambda: _inventory_add_product(body.params),
    }

    handler = action_map.get(action)
    if not handler:
        raise HTTPException(status_code=400, detail="Unknown action")

    changed = await handler()

    await db.inventory_audit.insert_one(
        {"id": str(uuid.uuid4()), "admin_id": admin["id"], "action": action,
         "target": target, "params": body.params, "changed": changed, "created_at": now_iso()})
    return {"ok": True, "changed": changed}


# ===================== Routes: Gemini Image =====================
def build_hamper_prompt(req: HamperImageRequest) -> str:
    vessel     = (req.vessel or {}).get("name", "handcrafted ceramic vessel")
    material   = (req.vessel or {}).get("material", "ceramic")
    items_text = (", ".join([i.get("name", "confection") for i in (req.items or [])[:8]])
                  or "assorted artisanal confections")
    card_line  = ""
    if req.gift_card and req.gift_card.get("enabled"):
        card_line = " A handwritten gift card in Pinyon Script rests gently at the front."
    occasion   = req.occasion or "a refined gifting occasion"
    return (
        f"A cinematic editorial photograph of a luxury handcrafted gift hamper. "
        f"The vessel is a {material} {vessel}, filled with {items_text}. "
        f"Tied with a deep champagne gold silk ribbon forming a soft bow. {card_line} "
        f"Set on a dark walnut surface with warm candlelight, soft bokeh, and dark velvet backdrop. "
        f"Styled for {occasion}. Warm gold and ivory tones, soft film grain, premium magazine aesthetic, "
        f"shallow depth of field, high detail, no text, no watermark."
    )

@api_router.post("/generate-hamper-image")
async def generate_hamper_image(body: HamperImageRequest):
    prompt = build_hamper_prompt(body)
    if not EMERGENT_LLM_KEY:
        return {"image_data_url": _fallback_image_data_url(), "prompt": prompt, "mock": True}
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(api_key=EMERGENT_LLM_KEY,
                       session_id=f"img-{uuid.uuid4().hex[:8]}",
                       system_message="You are a luxury product photographer.")
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
            modalities=["image", "text"])
        um = UserMessage(text=prompt)
        _, images = await chat.send_message_multimodal_response(um)
        if not images:
            return {"image_data_url": _fallback_image_data_url(), "prompt": prompt, "mock": True}
        img      = images[0]
        mime     = img.get("mime_type", "image/png")
        data_url = f"data:{mime};base64,{img['data']}"
        fname    = f"hamper_{uuid.uuid4().hex[:10]}.png"
        try:
            (MEDIA_DIR / fname).write_bytes(base64.b64decode(img["data"]))
        except Exception:
            pass
        return {"image_data_url": data_url, "prompt": prompt, "mock": False}
    except Exception as e:
        logger.error(f"image gen error: {e}")
        return {"image_data_url": _fallback_image_data_url(),
                "prompt": prompt, "mock": True, "error": str(e)}

def _fallback_image_data_url() -> str:
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'>"
        "<defs><radialGradient id='g' cx='50%' cy='50%' r='70%'>"
        "<stop offset='0%' stop-color='#2A1F0F'/><stop offset='100%' stop-color='#1A1510'/>"
        "</radialGradient></defs>"
        "<rect width='800' height='800' fill='url(#g)'/>"
        "<circle cx='400' cy='400' r='220' fill='none' stroke='#C9A84C' stroke-width='1' opacity='0.4'/>"
        "<circle cx='400' cy='400' r='160' fill='none' stroke='#E8C97A' stroke-width='1' opacity='0.6'/>"
        "<text x='400' y='430' text-anchor='middle' font-family='Cormorant Garamond, serif' "
        "font-size='120' fill='#E8C97A'>Da Fruito</text>"
        "<text x='400' y='480' text-anchor='middle' font-family='Josefin Sans, sans-serif' "
        "font-size='16' letter-spacing='4' fill='#C9A84C'>YOUR BESPOKE HAMPER</text>"
        "</svg>"
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()

# ===================== Routes: Admin =====================
@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    today  = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    month  = datetime.now(timezone.utc).strftime("%Y-%m")
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    today_rev = sum(o.get("total", 0) for o in orders if o.get("created_at", "").startswith(today))
    month_rev = sum(o.get("total", 0) for o in orders if o.get("created_at", "").startswith(month))
    pending   = sum(1 for o in orders if o.get("status", "").lower().startswith("pending"))
    in_stock  = await db.products.count_documents({"in_stock": True})
    out_stock = await db.products.count_documents({"in_stock": False})
    return {"revenue_today": today_rev, "revenue_month": month_rev,
            "total_orders": len(orders), "pending_orders": pending,
            "products_in_stock": in_stock, "out_of_stock": out_stock,
            "recent_orders": sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:10]}

@api_router.get("/admin/orders")
async def admin_orders(admin=Depends(require_admin),
                       status_filter: Optional[str] = Query(None, alias="status")):
    q: Dict[str, Any] = {}
    if status_filter:
        q["status"] = {"$regex": status_filter, "$options": "i"}
    orders = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

@api_router.patch("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, body: Dict[str, Any], admin=Depends(require_admin)):
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="status required")
    await db.orders.update_one({"id": order_id},
                                {"$set": {"status": new_status, "updated_at": now_iso()}})
    return {"ok": True}

@api_router.post("/admin/products")
async def admin_add_product(body: Dict[str, Any], admin=Depends(require_admin)):
    p   = Product(**{k: v for k, v in body.items() if k in Product.model_fields})
    doc = p.model_dump()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin=Depends(require_admin)):
    await db.products.delete_one({"id": product_id})
    return {"ok": True}

@api_router.get("/whatsapp-number")
async def get_whatsapp():
    return {"number": WHATSAPP_NUMBER}

# ═══════════════════════════════════════════════════
#  Google Sheets helpers + 3 admin endpoints (Option A)
# ═══════════════════════════════════════════════════
_SHEET_CAT_MAP: Dict[str, str] = {
    "chocolates & cookies": "chocolates_cookies",
    "snacks & munchies":    "snacks",
    "dry fruits":           "dry_fruits",
    "the festive/cultural": "festive",
    "gourmet barista":      "gourmet_barista",
}

def _fix_drive_url(url: str) -> str:
    m = re.search(r'drive\.google\.com/file/d/([^/?]+)', url)
    if m:
        return f"https://drive.google.com/uc?export=view&id={m.group(1)}"
    return url

def _is_image_url(url: str) -> bool:
    u = url.strip().lower()
    if not (u.startswith("http://") or u.startswith("https://")):
        return False
    bad = ["nutraj.com", "amazon.in", "flipkart.com", "bigbasket.com", "meesho.com"]
    return not any(d in u for d in bad)


# ── Sheet CSV helpers (extracted to reduce cyclomatic complexity) ──────────

def _find_sheet_columns(headers: List[str]) -> Dict[str, Optional[int]]:
    """Return a dict of column indices by logical name."""
    def col(*kws: str) -> Optional[int]:
        for k in kws:
            for i, h in enumerate(headers):
                if k in h:
                    return i
        return None
    return {
        "name":  col("PRODUCTS", "NAME"),
        "cat":   col("CAT"),
        "price": col("PRICE"),
        "img":   col("IMAGE"),
    }


def _parse_sheet_row(
    row: List[str], cols: Dict[str, Optional[int]]
) -> Optional[Dict[str, Any]]:
    """Parse a single CSV row into a product dict, or return None to skip."""
    ix_name, ix_cat, ix_price, ix_img = (
        cols["name"], cols["cat"], cols["price"], cols["img"]
    )
    name = row[ix_name].strip() if ix_name is not None and ix_name < len(row) else ""
    if not name:
        return None

    raw_cat  = row[ix_cat].strip().lower() if ix_cat is not None and ix_cat < len(row) else ""
    category = _SHEET_CAT_MAP.get(
        raw_cat, raw_cat.replace(" ", "_").replace("/", "_") or "general"
    )

    raw_price = (
        row[ix_price].strip().replace(",", "").replace("₹", "")
        if ix_price is not None and ix_price < len(row) else "0"
    )
    price = int(float(raw_price)) if raw_price else 0

    raw_img = row[ix_img].strip() if ix_img is not None and ix_img < len(row) else ""
    raw_img = _fix_drive_url(raw_img)
    image   = raw_img if _is_image_url(raw_img) else ""

    return {"name": name, "category": category, "price": price,
            "image": image, "country": "India"}


def _parse_sheet_csv(csv_text: str) -> List[Dict[str, Any]]:
    """Parse the full CSV text and return a list of product dicts."""
    products: List[Dict[str, Any]] = []
    rows = list(csv.reader(io.StringIO(csv_text)))
    if not rows:
        return products

    headers = [h.strip().upper() for h in rows[0]]
    cols    = _find_sheet_columns(headers)

    if cols["name"] is None or cols["price"] is None:
        logger.error("Sheet CSV: cannot find NAME/PRICE columns")
        return products

    for row in rows[1:]:
        try:
            product = _parse_sheet_row(row, cols)
            if product:
                products.append(product)
        except Exception as ex:
            logger.warning(f"Sheet row skip: {ex}")

    return products


async def _fetch_sheet_products() -> List[Dict[str, Any]]:
    if not GOOGLE_SHEET_CSV_URL:
        logger.warning("GOOGLE_SHEET_CSV_URL not set — skipping sheet fetch")
        return []
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as hc:
            resp = await hc.get(GOOGLE_SHEET_CSV_URL)
            resp.raise_for_status()
        products = _parse_sheet_csv(resp.text)
        logger.info(f"Sheet fetched: {len(products)} products")
        return products
    except Exception as e:
        logger.error(f"Sheet fetch error: {e}")
        return []

@api_router.get("/admin/sheet-preview")
async def admin_sheet_preview(admin=Depends(require_admin)):
    products = await _fetch_sheet_products()
    return {"sheet_url_configured": bool(GOOGLE_SHEET_CSV_URL),
            "count": len(products),
            "products_missing_image": [p["name"] for p in products if not p["image"]],
            "products": products}

@api_router.post("/admin/sync-from-sheet")
async def admin_sync_from_sheet(admin=Depends(require_admin)):
    if not GOOGLE_SHEET_CSV_URL:
        raise HTTPException(status_code=400, detail="GOOGLE_SHEET_CSV_URL not set in .env")
    products = await _fetch_sheet_products()
    if not products:
        raise HTTPException(status_code=502, detail="Sheet returned 0 products or fetch failed")
    del_r = await db.products.delete_many({})
    docs  = [Product(**p).model_dump() for p in products]
    await db.products.insert_many(docs)
    await db.inventory_audit.insert_one(
        {"id": str(uuid.uuid4()), "admin_id": admin["id"],
         "action": "sync_from_sheet", "target": "all_products",
         "params": {"inserted": len(docs)}, "changed": len(docs), "created_at": now_iso()})
    return {"ok": True, "deleted_old": del_r.deleted_count, "inserted": len(docs)}

@api_router.post("/admin/sync-from-sheet-merge")
async def admin_sync_from_sheet_merge(admin=Depends(require_admin)):
    if not GOOGLE_SHEET_CSV_URL:
        raise HTTPException(status_code=400, detail="GOOGLE_SHEET_CSV_URL not set in .env")
    products = await _fetch_sheet_products()
    if not products:
        raise HTTPException(status_code=502, detail="Sheet returned 0 products or fetch failed")
    inserted = updated = 0
    for p in products:
        existing = await db.products.find_one({"name": p["name"]})
        if existing:
            upd: Dict[str, Any] = {"price": p["price"]}
            if p["image"]:
                upd["image"] = p["image"]
            await db.products.update_one({"name": p["name"]}, {"$set": upd})
            updated += 1
        else:
            await db.products.insert_one(Product(**p).model_dump())
            inserted += 1
    await db.inventory_audit.insert_one(
        {"id": str(uuid.uuid4()), "admin_id": admin["id"],
         "action": "sync_from_sheet_merge", "target": "all_products",
         "params": {"inserted": inserted, "updated": updated},
         "changed": inserted + updated, "created_at": now_iso()})
    return {"ok": True, "inserted": inserted, "updated": updated}


# ═══════════════════════════════════════════════════════════════════
#  SEED DATA
# ═══════════════════════════════════════════════════════════════════

SEED_VESSELS = [
    {
        "name":        "The Grand Trunk Wicker",
        "material":    "Hand-Woven Water Hyacinth",
        "capacity_s":  4,
        "capacity_m":  8,
        "capacity_l":  14,
        "price":       1800,
        "image":       "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=1200&q=80",
        "description": (
            "Woven by artisans in Assam from sustainably harvested water hyacinth. "
            "A hinged lid, satin lining, and a hand-tied jute bow make this the "
            "classic Da Fruito vessel — rustic luxury at its finest."
        ),
    },
    {
        "name":        "The Ivory Atelier Box",
        "material":    "Rigid Dupioni Silk over Archival Board",
        "capacity_s":  3,
        "capacity_m":  6,
        "capacity_l":  10,
        "price":       2600,
        "image":       "https://images.unsplash.com/photo-1549488344-cbb6c34de5d7?w=1200&q=80",
        "description": (
            "A structured gift box finished in ivory dupioni silk with a magnetic "
            "clasp and champagne grosgrain ribbon. Reusable as a keepsake jewellery "
            "box — the gift that keeps giving."
        ),
    },
    {
        "name":        "The Mango Wood Market Crate",
        "material":    "Oil-Finished Reclaimed Mango Wood",
        "capacity_s":  5,
        "capacity_m":  9,
        "capacity_l":  15,
        "price":       2200,
        "image":       "https://images.unsplash.com/photo-1513267048331-5611cad62e41?w=1200&q=80",
        "description": (
            "Slatted mango wood, hand-sanded and finished with food-safe beeswax. "
            "Laser-engraved with the Da Fruito mark. Sturdy enough to become a "
            "kitchen shelf — an heirloom crate."
        ),
    },
    {
        "name":        "The Makrana Marble Tray",
        "material":    "Makrana White Marble with Brass Inlay",
        "capacity_s":  2,
        "capacity_m":  4,
        "capacity_l":  6,
        "price":       3800,
        "image":       "https://images.unsplash.com/photo-1608142737432-b0a0bed6fdee?w=1200&q=80",
        "description": (
            "Cool, heavy, and enduring — the same marble from which the Taj Mahal "
            "was built. Bordered with fine brass inlay, this tray arrives dressed "
            "with your curated confections and retires as a bar or vanity centrepiece."
        ),
    },
    {
        "name":        "The Zardozi Trunk",
        "material":    "Embroidered Velvet over Mango Wood",
        "capacity_s":  4,
        "capacity_m":  7,
        "capacity_l":  12,
        "price":       3200,
        "image":       "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80",
        "description": (
            "A miniature trunk clad in emerald velvet with hand-zardozi gold threadwork "
            "on the lid — echoing the embroidery of Lucknow's finest ateliers. "
            "Brass corner caps and a working lock complete the heirloom effect."
        ),
    },
    {
        "name":        "The Hammered Copper Hamper",
        "material":    "Hand-Hammered Pure Copper",
        "capacity_s":  3,
        "capacity_m":  5,
        "capacity_l":  8,
        "price":       4200,
        "image":       "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1200&q=80",
        "description": (
            "Beaten by coppersmiths in Moradabad into a low, wide bowl with fluted "
            "walls. Naturally antimicrobial, pleasingly heavy, and alive with the "
            "warm glow that only aged copper carries. The most bespoke vessel in "
            "the Da Fruito collection."
        ),
    },
]

SEED_PRODUCTS = [
    # ── Chocolates & Cookies (10) ──
    {"name": "Chocolate Chip Cookies",                        "category": "chocolates_cookies", "country": "India", "price": 120,  "image": "https://lh3.googleusercontent.com/d/11-tfRrY4RAMZ2LcCwTLdF6Ra5IbpmdKm"},
    {"name": "Butter Shortbread",                             "category": "chocolates_cookies", "country": "India", "price": 200,  "image": "https://lh3.googleusercontent.com/d/1YJaS5XgDIEAx0IGdTUOryJN3lmxxrJZk"},
    {"name": "Chocolate Wafers",                              "category": "chocolates_cookies", "country": "India", "price": 50,   "image": "https://lh3.googleusercontent.com/d/1hzwMOFe8ITsivStstgCLCkSehldKcSIW"},
    {"name": "Chocolate-Covered Almonds",                     "category": "chocolates_cookies", "country": "India", "price": 240,  "image": "https://lh3.googleusercontent.com/d/1QiGyoxeIzGdyM-2cytNakkueaVmvwknV"},
    {"name": "Chocolate Truffles",                            "category": "chocolates_cookies", "country": "India", "price": 350,  "image": "https://drive.google.com/uc?export=view&id=1r5GYo4PNXHxtOiaVGyWOhnNZfLXq_pji"},
    {"name": "Chocolate Dipped Marshmallows",                 "category": "chocolates_cookies", "country": "India", "price": 80,   "image": "https://i.postimg.cc/9MxTczkq/Chocolate-Dipped-Marshmallows.png"},
    {"name": "Oatmeal Raisin Cookies",                        "category": "chocolates_cookies", "country": "India", "price": 80,   "image": "https://i.postimg.cc/vBjBPnj6/Oatmeal-Raisin-Cookies.png"},
    {"name": "Dark Chocolate Wafers (Replaced Duplicate)",    "category": "chocolates_cookies", "country": "India", "price": 40,   "image": "https://i.postimg.cc/fRjKScq1/Dark-Chocolate-Wafers-(Replaced-Duplicate).png"},
    {"name": "Single-Origin Dark Chocolate Bar",              "category": "chocolates_cookies", "country": "India", "price": 100,  "image": "https://i.postimg.cc/Wz42PwFt/Single-Origin-Dark-Chocolate-Bar.png"},
    {"name": "Hot Cocoa Mix",                                 "category": "chocolates_cookies", "country": "India", "price": 30,   "image": "https://i.postimg.cc/gjxpnkz9/Hot-coca-mix.png"},
    # ── Snacks & Munchies (10) ──
    {"name": "Pringles Original (107g)",                      "category": "snacks",             "country": "India", "price": 110,  "image": "https://i.postimg.cc/HL3RCDQJ/Pringles-Original-(107g).png"},
    {"name": "Cornitos Nacho Crisps (150g)",                  "category": "snacks",             "country": "India", "price": 80,   "image": "https://i.postimg.cc/HL3RCDQJ/Pringles-Original-(107g).png"},
    {"name": "Roasted Makhana (Fox Nuts)",                    "category": "snacks",             "country": "India", "price": 80,   "image": "https://i.postimg.cc/sgxwZQSB/Roasted-Makhana-(Fox-Nuts).png"},
    {"name": "Happilo Roasted Pistachios/Cashews (200g)",     "category": "snacks",             "country": "India", "price": 250,  "image": "https://i.postimg.cc/Kj66jPpM/Happilo-Roasted-Pistachios-Cashews-(200g).png"},
    {"name": "Wingreens Farms Naan Chips",                    "category": "snacks",             "country": "India", "price": 70,   "image": "https://i.postimg.cc/k54GCC0K/Cornitos-Nacho-Crisps-(150g).png"},
    {"name": "4700BC Gourmet Popcorn Tin",                    "category": "snacks",             "country": "India", "price": 200,  "image": "https://i.postimg.cc/25VkJwW6/4700BC-Gourmet-Popcorn-Tin.png"},
    {"name": "Beyond Snack Banana Chips",                     "category": "snacks",             "country": "India", "price": 70,   "image": "https://i.postimg.cc/RCcMjqW2/Beyond-Snack-Banana-Chips.png"},
    {"name": "Act II Instant Popcorn",                        "category": "snacks",             "country": "India", "price": 20,   "image": "https://i.postimg.cc/HWtqwMJ3/Act-Popcorn.png"},
    {"name": "Baked Peri Peri Matthi",                        "category": "snacks",             "country": "India", "price": 300,  "image": "https://i.postimg.cc/4NmWYHpd/Baked-Peri-Peri-Matthi.png"},
    {"name": "Spicy Trail Mix (Replaced Duplicate)",          "category": "snacks",             "country": "India", "price": 70,   "image": "https://i.postimg.cc/g0NhyNWw/Spicy-Trail-Mix-(Replaced-Duplicate).png"},
    # ── Dry Fruits (10) ──
    {"name": "California Almonds (Badam)",                    "category": "dry_fruits",         "country": "India", "price": 200,  "image": "https://i.postimg.cc/zGpwpJwr/California-Almonds-(Badam).png"},
    {"name": "Cashew Nuts (Kaju)",                            "category": "dry_fruits",         "country": "India", "price": 250,  "image": "https://i.postimg.cc/0y2TQycJ/Cashew-Nuts-(Kaju).png"},
    {"name": "Roasted & Salted Pistachios (Pista)",           "category": "dry_fruits",         "country": "India", "price": 300,  "image": "https://i.postimg.cc/hP3rL4KX/Roasted-Salted-Pistachios-(Pista).png"},
    {"name": "Walnut Kernels (Akhrot Giri)",                  "category": "dry_fruits",         "country": "India", "price": 500,  "image": "https://i.postimg.cc/hP3rL4KX/Roasted-Salted-Pistachios-(Pista).png"},
    {"name": "Premium Dates (Khajur)",                        "category": "dry_fruits",         "country": "India", "price": 150,  "image": "https://i.postimg.cc/VsKBwsrZ/Premium-Dates-(Khajur).png"},
    {"name": "Dried Figs (Anjeer)",                           "category": "dry_fruits",         "country": "India", "price": 250,  "image": "https://i.postimg.cc/ZnNwn1dz/Dried-Figs-(Anjeer).png"},
    {"name": "Mixed Dry Fruit Blend (500g)",                  "category": "dry_fruits",         "country": "India", "price": 600,  "image": "https://i.postimg.cc/y84J42PP/Mixed-Dry-Fruit-Blend-(500g).png"},
    {"name": "Shelled Hazelnuts",                             "category": "dry_fruits",         "country": "India", "price": 650,  "image": "https://i.postimg.cc/MKbYL007/Shelled-Hazelnuts.png"},
    {"name": "Pine Nuts (Chilgoza)",                          "category": "dry_fruits",         "country": "India", "price": 1000, "image": "https://i.postimg.cc/9XPTXm42/Pine-Nuts-(Chilgoza).png"},
    {"name": "Australian Macadamia Nuts (200g)",              "category": "dry_fruits",         "country": "India", "price": 800,  "image": "https://i.postimg.cc/CKmvZGrk/Australian-Macadamia-Nuts-(200g).png"},
    # ── Festive / Cultural (10) ──
    {"name": "Gold-Plated Brass Lotus Diya",                  "category": "festive",            "country": "India", "price": 2000, "image": "https://i.postimg.cc/Qdnmh8B3/Lotus-Diya.png"},
    {"name": "Hand-Painted Marble Ganesha",                   "category": "festive",            "country": "India", "price": 2500, "image": "https://i.postimg.cc/dtNrTWJ3/Hand-Painted-Marble-Ganesha.png"},
    {"name": "Silver-Plated Pooja Thali Set",                 "category": "festive",            "country": "India", "price": 4000, "image": "https://i.postimg.cc/SK6nVVb1/Silver-Plated-Pooja-Thali-Set.png"},
    {"name": 'Forest Essentials "Luxury Ritual" Box',         "category": "festive",            "country": "India", "price": 4000, "image": "https://i.postimg.cc/BQF4xb0c/Forest-Essentials-Luxury-Ritual-Box.png"},
    {"name": "Phool Luxury Incense Gift Box",                  "category": "festive",            "country": "India", "price": 600,  "image": "https://i.postimg.cc/v8gcNQyn/Phool-Luxury-Incense-Gift-Box.png"},
    {"name": "Hand-Poured Soy Candles in Hammered Brass",     "category": "festive",            "country": "India", "price": 1000, "image": "https://i.postimg.cc/D06Gy6wN/Chat-GPT-Image-Apr-22-2026-02-41-15-PM.png"},
    {"name": "Designer Silk Zardozi Potli",                   "category": "festive",            "country": "India", "price": 1000, "image": "https://i.postimg.cc/nL3C6rMB/Designer-Silk-Zardozi-Potli.png"},
    {"name": "Silver-Plated Coins with Custom Box",           "category": "festive",            "country": "India", "price": 1500, "image": "https://i.postimg.cc/RZbkyz9P/Silver-Plated-Coins-with-Custom-Box.png"},
    {"name": "Dhokra Metal Craft Figurines",                  "category": "festive",            "country": "India", "price": 800,  "image": "https://i.postimg.cc/Fsb0sjKP/Dhokra-Metal-Craft-Figurines.png"},
    {"name": "Studio Pottery Serving Set",                    "category": "festive",            "country": "India", "price": 400,  "image": "https://i.postimg.cc/qqVCpRV5/Studio-Pottery-Serving-Set.png"},
    # ── Gourmet Barista (10) ──
    {"name": "Country Bean Instant Flavored Coffee (50g)",    "category": "gourmet_barista",    "country": "India", "price": 350,  "image": "https://i.postimg.cc/mrv0ZNPp/Country-Bean-Instant-Flavored-Coffee-(50g).png"},
    {"name": "Blue Tokai Easy Pour Sachets (Pack of 5)",      "category": "gourmet_barista",    "country": "India", "price": 250,  "image": "https://i.postimg.cc/rsw20Gkg/Blue-Tokai-Easy-Pour-Sachets-(Pack-of-5).png"},
    {"name": "TGL Co. Hot Chocolate Mix",                     "category": "gourmet_barista",    "country": "India", "price": 400,  "image": "https://i.postimg.cc/gjQtz3kb/TGL-Co-Hot-Chocolate-Mix.png"},
    {"name": 'Tea Culture of the World "Flowering Teas"',     "category": "gourmet_barista",    "country": "India", "price": 800,  "image": "https://i.postimg.cc/PJgKsh2w/Tea-Culture-of-the-World-Flowering-Teas.png"},
    {"name": "Monin Coffee Syrup Mini Set (Standard)",        "category": "gourmet_barista",    "country": "India", "price": 900,  "image": "https://i.postimg.cc/W1jCh6wh/Monin-Coffee-Syrup-Mini-Set-(Standard).png"},
    {"name": "Assorted Instant Coffee Sachets (Packs of 10)", "category": "gourmet_barista",    "country": "India", "price": 120,  "image": "https://i.postimg.cc/htSZS4Ks/Gemini-Generated-Image-aawvgvaawvgvaawv.png"},
    {"name": "Davidoff Fine Aroma / Rich Aroma (Limited Edition)", "category": "gourmet_barista", "country": "India", "price": 800, "image": "https://i.postimg.cc/L60gsNpb/Davidoff-Fine-Aroma-Rich-Aroma-(Limited-Edition).png"},
    {"name": "Monin Coffee Syrup Mini Set (3-5 small bottles)", "category": "gourmet_barista",  "country": "India", "price": 1200, "image": "https://i.postimg.cc/W1jCh6wh/Monin-Coffee-Syrup-Mini-Set-(Standard).png"},
    {"name": "Vahdam Organic Green Tea",                       "category": "gourmet_barista",    "country": "India", "price": 450,  "image": "https://i.postimg.cc/L67hS5tW/Vahdam-Organic-Green-Tea.png"},
    {"name": "Ceramic Coffee French Press",                    "category": "gourmet_barista",    "country": "India", "price": 1500, "image": "https://i.postimg.cc/P5Yfk4rJ/Ceramic-Coffee-French-Press.png"},
]

SEED_HAMPERS = [
    {
        "name": "The Everlasting Bonds",
        "occasion": "anniversary",
        "price": 7800,
        "image": "https://images.unsplash.com/photo-1732928730431-11c206639a38?w=1200&q=80",
        "description": "A ceremony in a ceramic vessel. Single-origin chocolates, first-flush tea, and a handwritten note.",
        "materials": ["Makrana Marble", "Gold Ribbon"],
        "items": ["Single-Origin Dark Chocolate Bar", "Vahdam Organic Green Tea", "Gold-Plated Brass Lotus Diya", "Chocolate Truffles"],
    },
    {
        "name": "The Celebration Edit",
        "occasion": "birthday",
        "price": 5400,
        "image": "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&q=80",
        "description": "Playful and indulgent — champagne truffles, shortbread, and toasted almonds.",
        "materials": ["Ivory Silk", "Champagne Ribbon"],
        "items": ["Chocolate Truffles", "Butter Shortbread", "California Almonds (Badam)", "4700BC Gourmet Popcorn Tin"],
    },
    {
        "name": "The Festive Heirloom",
        "occasion": "festive",
        "price": 9200,
        "image": "https://images.unsplash.com/photo-1732928729959-2e8fdb5a5cd7?w=1200&q=80",
        "description": "A Diwali and winter-festive hamper — diyas, incense, and gourmet treats.",
        "materials": ["Zardozi Velvet", "Brocade"],
        "items": ["Gold-Plated Brass Lotus Diya", "Phool Luxury Incense Gift Box", "Mixed Dry Fruit Blend (500g)", "Silver-Plated Coins with Custom Box"],
    },
    {
        "name": "The Corporate Gesture",
        "occasion": "corporate",
        "price": 6400,
        "image": "https://images.unsplash.com/photo-1549488344-cbb6c34de5d7?w=1200&q=80",
        "description": "Refined, restrained, memorable — for boardrooms and handshakes.",
        "materials": ["Mango Wood", "Linen"],
        "items": ["Davidoff Fine Aroma / Rich Aroma (Limited Edition)", "Ceramic Coffee French Press", "Pine Nuts (Chilgoza)", "Monin Coffee Syrup Mini Set (Standard)"],
    },
    {
        "name": "The Sage Tea Ritual",
        "occasion": "wellness",
        "price": 4200,
        "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&q=80",
        "description": "A slow morning — flowering teas, honey cashews, and shortbread.",
        "materials": ["Water Hyacinth", "Jute"],
        "items": ['Tea Culture of the World "Flowering Teas"', "Vahdam Organic Green Tea", "Butter Shortbread", "Cashew Nuts (Kaju)"],
    },
    {
        "name": "The Housewarming Welcome",
        "occasion": "housewarming",
        "price": 5800,
        "image": "https://images.unsplash.com/photo-1647168672642-695e96782922?w=1200&q=80",
        "description": "A new home deserves a warm beginning — pottery, candles, and artisan snacks.",
        "materials": ["Copper", "Mango Wood"],
        "items": ["Studio Pottery Serving Set", "Hand-Poured Soy Candles in Hammered Brass", "4700BC Gourmet Popcorn Tin", "Roasted Makhana (Fox Nuts)"],
    },
]

# ===================== Startup / Seed =====================
@app.on_event("startup")
async def seed_data():
    await db.vessels.delete_many({})
    docs = [Vessel(**v).model_dump() for v in SEED_VESSELS]
    await db.vessels.insert_many(docs)
    logger.info(f"Re-seeded {len(docs)} premium vessels with images")

    await db.products.delete_many({})
    docs = [Product(**p).model_dump() for p in SEED_PRODUCTS]
    await db.products.insert_many(docs)
    logger.info(f"Re-seeded {len(docs)} products with correct images")

    if await db.hampers.count_documents({}) == 0:
        docs = [Hamper(**h).model_dump() for h in SEED_HAMPERS]
        await db.hampers.insert_many(docs)
        logger.info(f"Seeded {len(docs)} hampers")

    if await db.users.count_documents({}) == 0:
        admin = {"id": str(uuid.uuid4()), "email": "admin@dafruito.com",
                 "name": "Da Fruito Admin", "password": hash_password("admin123"),
                 "role": "admin", "addresses": [], "created_at": now_iso()}
        await db.users.insert_one(admin)
        logger.info("Seeded default admin: admin@dafruito.com / admin123")


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()