"""
Da Fruito — Luxury Hamper E-commerce Backend
FastAPI + MongoDB + Gemini (via Emergent Universal Key) + Razorpay (arch) + WhatsApp
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import hashlib
import hmac
import json
import uuid
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ===================== Config =====================
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
WHATSAPP_NUMBER = os.environ.get('WHATSAPP_NUMBER', '+91XXXXXXXXXX')
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', '')
# Admin emails: comma-separated; users signing in with these emails are
# granted admin role on first sync. Empty list means "first user becomes admin".
ADMIN_EMAILS = {e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()}

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Ensure media directory exists for generated images
MEDIA_DIR = ROOT_DIR / 'generated_images'
MEDIA_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("dafruito")

app = FastAPI(title="Da Fruito API", version="1.0.0")
api_router = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)


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
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # chocolates, biscuits, teas, preserves, nuts, wines, specialty
    country: str = ""
    price: int
    image: str = ""
    description: str = ""
    in_stock: bool = True
    stock_count: int = 100
    weight_grams: int = 100
    created_at: str = Field(default_factory=now_iso)


class Vessel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    material: str
    capacity_s: int = 1
    capacity_m: int = 1
    capacity_l: int = 1
    price: int
    image: str = ""
    description: str = ""


class Hamper(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    occasion: str
    price: int
    image: str = ""
    description: str = ""
    materials: List[str] = []
    items: List[str] = []


class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    kind: Literal["hamper", "bespoke"]
    reference_id: Optional[str] = None  # hamper id
    bespoke: Optional[Dict[str, Any]] = None  # full bespoke payload
    name: str
    price: int
    quantity: int = 1
    image: str = ""
    created_at: str = Field(default_factory=now_iso)


class OrderIn(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    sender_name: str
    recipient_name: str
    contact: str
    address: str
    delivery_date: Optional[str] = None
    occasion: Optional[str] = None
    notes: Optional[str] = None
    payment_method: Literal["razorpay", "cod", "whatsapp"]
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


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
    vessel: Optional[Dict[str, Any]] = None
    items: List[Dict[str, Any]] = []
    gift_card: Optional[Dict[str, Any]] = None
    occasion: Optional[str] = None


# ===================== Auth Helpers =====================
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, pw_hash: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), pw_hash.encode())
    except Exception:
        return False


def make_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
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
    # First user becomes admin
    count = await db.users.count_documents({})
    role = "admin" if count == 0 else "customer"
    doc = {
        "id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "password": hash_password(body.password),
        "role": role,
        "addresses": [],
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = make_token(user_id, role)
    return {"token": token, "user": {"id": user_id, "email": body.email.lower(), "name": body.name, "role": role}}


@api_router.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}}


@api_router.get("/auth/me")
async def me(user=Depends(require_user)):
    return user


# ===================== Firebase ID Token Verification (JWKS-based) =====================
# We verify Firebase ID tokens using Google's public x509 certs — no service account
# key file required. This is the same validation firebase-admin performs internally.
import requests as _rq
import time as _time
from cryptography import x509 as _x509
from cryptography.hazmat.backends import default_backend as _default_backend

_FB_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
_fb_certs_cache = {"exp": 0, "certs": {}}


def _fetch_firebase_certs() -> Dict[str, Any]:
    """Fetch & cache Google's Firebase ID token signing certs (x509 PEM by kid)."""
    now = _time.time()
    if _fb_certs_cache["exp"] > now and _fb_certs_cache["certs"]:
        return _fb_certs_cache["certs"]
    try:
        r = _rq.get(_FB_CERTS_URL, timeout=8)
        r.raise_for_status()
        certs_pem = r.json()  # { kid: pem, ... }
        parsed = {}
        for kid, pem in certs_pem.items():
            cert = _x509.load_pem_x509_certificate(pem.encode(), _default_backend())
            parsed[kid] = cert.public_key()
        # cache for 1 hour (certs rotate less frequently)
        _fb_certs_cache["certs"] = parsed
        _fb_certs_cache["exp"] = now + 3600
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
    kid = header.get("kid")
    certs = _fetch_firebase_certs()
    key = certs.get(kid)
    if not key:
        # try one fresh fetch in case of rotation
        _fb_certs_cache["exp"] = 0
        certs = _fetch_firebase_certs()
        key = certs.get(kid)
    if not key:
        raise HTTPException(status_code=401, detail="Unknown signing key")
    try:
        payload = jwt.decode(
            id_token,
            key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
            options={"require": ["exp", "iat", "aud", "iss", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="ID token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid ID token: {e}")
    if not payload.get("sub"):
        raise HTTPException(status_code=401, detail="ID token missing subject")
    return payload


class FirebaseSyncIn(BaseModel):
    id_token: str
    name: Optional[str] = ""
    email: Optional[str] = ""


@api_router.post("/auth/firebase-sync")
async def firebase_sync(body: FirebaseSyncIn):
    """Exchange a Firebase ID token for a backend JWT.

    Verifies the ID token against Google's public certs, then creates or fetches
    a MongoDB user record keyed by email (firebase uid stored for reference).
    First user (or email in ADMIN_EMAILS) gets the admin role.
    """
    claims = verify_firebase_id_token(body.id_token)
    uid = claims.get("sub")
    email = (claims.get("email") or body.email or "").lower()
    name = claims.get("name") or body.name or (email.split("@")[0] if email else "Guest")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required on the Firebase account")

    existing = await db.users.find_one({"$or": [{"firebase_uid": uid}, {"email": email}]})
    if existing:
        # Ensure firebase_uid is linked on legacy email-only users
        updates = {}
        if not existing.get("firebase_uid"):
            updates["firebase_uid"] = uid
        if name and existing.get("name") != name and not existing.get("name_locked"):
            updates["name"] = name
        if updates:
            await db.users.update_one({"id": existing["id"]}, {"$set": updates})
            existing.update(updates)
        user_doc = existing
    else:
        count = await db.users.count_documents({})
        is_admin_email = email in ADMIN_EMAILS if ADMIN_EMAILS else False
        role = "admin" if (count == 0 or is_admin_email) else "customer"
        user_doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": name,
            "firebase_uid": uid,
            "password": "",  # Firebase handles credentials
            "role": role,
            "addresses": [],
            "created_at": now_iso(),
        }
        await db.users.insert_one(user_doc)

    token = make_token(user_doc["id"], user_doc["role"])
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"],
        },
    }


@api_router.post("/auth/promote-admin")
async def promote_admin(body: Dict[str, Any], admin=Depends(require_admin)):
    """Admin-only: promote another user to admin by email."""
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
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "kind": item.get("kind", "hamper"),
        "reference_id": item.get("reference_id"),
        "bespoke": item.get("bespoke"),
        "name": item.get("name", "Hamper"),
        "price": int(item.get("price", 0)),
        "quantity": int(item.get("quantity", 1)),
        "image": item.get("image", ""),
        "created_at": now_iso(),
    }
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
    doc = {
        "id": order_id,
        "user_id": user["id"] if user else None,
        "items": body.items,
        "total": body.total,
        "sender_name": body.sender_name,
        "recipient_name": body.recipient_name,
        "contact": body.contact,
        "address": body.address,
        "delivery_date": body.delivery_date,
        "occasion": body.occasion,
        "notes": body.notes,
        "payment_method": body.payment_method,
        "razorpay_payment_id": body.razorpay_payment_id,
        "razorpay_order_id": body.razorpay_order_id,
        "status": "Pending COD" if body.payment_method == "cod" else ("Confirmed" if body.payment_method == "razorpay" else "Pending"),
        "created_at": now_iso(),
    }
    await db.orders.insert_one(doc)
    if user:
        await db.cart.delete_many({"user_id": user["id"]})
    doc.pop("_id", None)
    return doc


@api_router.get("/orders")
async def list_my_orders(user=Depends(require_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders


# ===================== Routes: Razorpay =====================
@api_router.post("/create-order")
async def razorpay_create_order(body: Dict[str, Any]):
    """Creates a Razorpay order. If keys are missing, returns a mock order
    so the frontend flow can still be demonstrated end-to-end."""
    amount = int(body.get("amount", 0))  # in paise
    currency = body.get("currency", "INR")
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        # mock
        return {
            "id": f"order_mock_{uuid.uuid4().hex[:12]}",
            "amount": amount,
            "currency": currency,
            "key_id": "rzp_test_mockkey",
            "mock": True,
        }
    try:
        import razorpay  # type: ignore
        rz = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = rz.order.create({"amount": amount, "currency": currency, "receipt": f"rcpt_{uuid.uuid4().hex[:8]}", "payment_capture": 1})
        return {**order, "key_id": RAZORPAY_KEY_ID, "mock": False}
    except Exception as e:
        logger.error(f"razorpay create-order error: {e}")
        return {"id": f"order_mock_{uuid.uuid4().hex[:12]}", "amount": amount, "currency": currency, "key_id": "rzp_test_mockkey", "mock": True}


@api_router.post("/verify-payment")
async def razorpay_verify(body: Dict[str, Any]):
    order_id = body.get("razorpay_order_id", "")
    payment_id = body.get("razorpay_payment_id", "")
    signature = body.get("razorpay_signature", "")
    if order_id.startswith("order_mock_") or not RAZORPAY_KEY_SECRET:
        return {"verified": True, "mock": True}
    expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    verified = hmac.compare_digest(expected, signature)
    return {"verified": verified, "mock": False}


# ===================== Gemini: helpers =====================
async def gemini_chat(session_id: str, system: str, history: List[ChatMessage], message: str) -> str:
    if not EMERGENT_LLM_KEY:
        return _mock_chat_response(message)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system)
        chat.with_model("gemini", "gemini-2.5-pro")
        # Replay history as context by including in system-like prelude (LlmChat maintains its own history per instance,
        # so we feed recent turns as a condensed context)
        context_prelude = ""
        if history:
            recent = history[-6:]
            lines = [f"{m.role.upper()}: {m.text}" for m in recent]
            context_prelude = "Previous conversation context:\n" + "\n".join(lines) + "\n\nCurrent user message: "
        um = UserMessage(text=(context_prelude + message) if context_prelude else message)
        resp = await chat.send_message(um)
        return resp if isinstance(resp, str) else str(resp)
    except Exception as e:
        logger.error(f"Gemini chat error: {e}")
        return _mock_chat_response(message)


def _mock_chat_response(message: str) -> str:
    m = message.lower()
    if any(w in m for w in ["hello", "hi", "hey"]):
        return "Hello! I am your gifting curator at Da Fruito. Tell me who you are gifting today and the occasion, and I shall compose something extraordinary for you."
    if "budget" in m:
        return "Our hampers range from ₹1,500 to ₹25,000+. For a truly memorable gift under ₹5,000, the Amber Truffle Edit or the Sage Tea Ritual are beloved choices. Shall I show you?"
    if any(w in m for w in ["anniversary", "wedding"]):
        return "For anniversaries, I recommend our 'Everlasting Bonds' collection — a hand-tied ceramic vessel with single-origin chocolates, darjeeling first-flush tea, and a Pinyon-Script gift card. Would you like to proceed with this?"
    if any(w in m for w in ["birthday"]):
        return "Birthdays deserve something playful and indulgent. The 'Celebration Edit' features champagne truffles, shortbread, and toasted almonds in a walnut-wood vessel. Shall we add a note?"
    return "I'd love to help you curate the perfect hamper. Tell me the occasion, your budget range, and what the recipient enjoys — and I shall suggest a few bespoke directions."


# ===================== Routes: AI Chat =====================
AI_SYSTEM_PROMPT = (
    "You are the Da Fruito gifting curator — a warm, editorial, elegant AI assistant for a luxury hamper brand based in Delhi & NCR. "
    "Speak softly and with refined taste. Use sensory, craft-oriented language (handwoven, single-origin, hand-tied, botanical). "
    "Never use emoji. Keep replies under 120 words. Offer occasion-sensitive recommendations, suggest bespoke vessels, "
    "curate confections by budget, and gently guide users toward the bespoke builder when appropriate. "
    "All prices are in INR. You can recommend from: Signature Collections (premade hampers), Bespoke Builder (custom), "
    "and individual confections (chocolates, truffles, biscuits, teas, preserves, nuts, wines, specialty items)."
)


@api_router.post("/ai-chat")
async def ai_chat(body: ChatIn):
    reply = await gemini_chat(body.session_id, AI_SYSTEM_PROMPT, body.history or [], body.message)
    await db.chat_logs.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": body.session_id,
        "message": body.message,
        "reply": reply,
        "created_at": now_iso(),
    })
    return {"reply": reply}


# ===================== Routes: AI Inventory (admin) =====================
INVENTORY_SYSTEM_PROMPT = (
    "You are Da Fruito's AI Inventory Manager. You convert a natural language admin command into a structured JSON action "
    "for review. Output ONLY valid JSON (no prose, no markdown code fences). "
    "Shape: {\"action\": one of [update_price, mark_out_of_stock, restore_stock, adjust_stock, list_out_of_stock, category_discount, delete_product, add_product], "
    "\"target\": string (product name or category, optional), \"params\": object, \"summary\": string (one-sentence human preview)}. "
    "Examples: "
    "'mark dark truffles out of stock' -> {\"action\":\"mark_out_of_stock\",\"target\":\"dark truffles\",\"params\":{},\"summary\":\"Mark Dark Truffles as out of stock.\"} "
    "'apply 15% discount to teas' -> {\"action\":\"category_discount\",\"target\":\"teas\",\"params\":{\"percent\":15},\"summary\":\"Apply 15% discount to Teas category.\"}"
)


@api_router.post("/ai-inventory")
async def ai_inventory(body: InventoryCmd, admin=Depends(require_admin)):
    reply = await gemini_chat(f"inv-{admin['id']}", INVENTORY_SYSTEM_PROMPT, [], body.command)
    # try to parse JSON out of reply
    parsed: Dict[str, Any]
    try:
        # strip code fences if any
        t = reply.strip()
        if t.startswith("```"):
            t = t.strip("`")
            # remove possible leading 'json'
            if t.lower().startswith("json"):
                t = t[4:]
        parsed = json.loads(t)
    except Exception:
        parsed = {"action": "unknown", "target": "", "params": {}, "summary": reply[:200]}
    return {"preview": parsed, "raw": reply}


class InventoryApply(BaseModel):
    action: str
    target: Optional[str] = None
    params: Dict[str, Any] = {}
    summary: Optional[str] = None


@api_router.post("/ai-inventory/apply")
async def ai_inventory_apply(body: InventoryApply, admin=Depends(require_admin)):
    action = body.action
    target = (body.target or "").strip().lower()
    changed = 0
    if action == "mark_out_of_stock":
        r = await db.products.update_many({"name": {"$regex": target, "$options": "i"}}, {"$set": {"in_stock": False}})
        changed = r.modified_count
    elif action == "restore_stock":
        r = await db.products.update_many({"name": {"$regex": target, "$options": "i"}}, {"$set": {"in_stock": True}})
        changed = r.modified_count
    elif action == "update_price":
        price = int(body.params.get("price", 0))
        r = await db.products.update_many({"name": {"$regex": target, "$options": "i"}}, {"$set": {"price": price}})
        changed = r.modified_count
    elif action == "category_discount":
        percent = float(body.params.get("percent", 0))
        prods = await db.products.find({"category": target}, {"_id": 0}).to_list(500)
        for p in prods:
            new_price = int(p["price"] * (1 - percent / 100.0))
            await db.products.update_one({"id": p["id"]}, {"$set": {"price": new_price}})
        changed = len(prods)
    elif action == "delete_product":
        r = await db.products.delete_many({"name": {"$regex": target, "$options": "i"}})
        changed = r.deleted_count
    elif action == "list_out_of_stock":
        prods = await db.products.find({"in_stock": False}, {"_id": 0}).to_list(500)
        return {"ok": True, "items": prods, "changed": len(prods)}
    elif action == "add_product":
        p = Product(name=body.params.get("name", "New Product"),
                    category=body.params.get("category", "specialty"),
                    price=int(body.params.get("price", 1000)),
                    country=body.params.get("country", "India"))
        await db.products.insert_one(p.model_dump())
        changed = 1
    else:
        raise HTTPException(status_code=400, detail="Unknown action")

    await db.inventory_audit.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin["id"],
        "action": action,
        "target": target,
        "params": body.params,
        "changed": changed,
        "created_at": now_iso(),
    })
    return {"ok": True, "changed": changed}


# ===================== Routes: Gemini Image =====================
def build_hamper_prompt(req: HamperImageRequest) -> str:
    vessel = (req.vessel or {}).get("name", "handcrafted ceramic vessel")
    material = (req.vessel or {}).get("material", "ceramic")
    items_text = ", ".join([i.get("name", "confection") for i in (req.items or [])[:8]]) or "assorted artisanal confections"
    card_line = ""
    if req.gift_card and req.gift_card.get("enabled"):
        card_line = " A handwritten gift card in Pinyon Script rests gently at the front."
    occasion = req.occasion or "a refined gifting occasion"
    return (
        f"A cinematic editorial photograph of a luxury handcrafted gift hamper. The vessel is a {material} {vessel}, "
        f"filled with {items_text}. Tied with a deep champagne gold silk ribbon forming a soft bow. {card_line} "
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
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"img-{uuid.uuid4().hex[:8]}", system_message="You are a luxury product photographer.")
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        um = UserMessage(text=prompt)
        _, images = await chat.send_message_multimodal_response(um)
        if not images:
            return {"image_data_url": _fallback_image_data_url(), "prompt": prompt, "mock": True}
        img = images[0]
        mime = img.get("mime_type", "image/png")
        data_url = f"data:{mime};base64,{img['data']}"
        # persist (optional: file)
        fname = f"hamper_{uuid.uuid4().hex[:10]}.png"
        try:
            (MEDIA_DIR / fname).write_bytes(base64.b64decode(img["data"]))
        except Exception:
            pass
        return {"image_data_url": data_url, "prompt": prompt, "mock": False}
    except Exception as e:
        logger.error(f"image gen error: {e}")
        return {"image_data_url": _fallback_image_data_url(), "prompt": prompt, "mock": True, "error": str(e)}


def _fallback_image_data_url() -> str:
    # deep walnut card with gold 'D' — 1px svg placeholder as data URL fallback
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'>"
        "<defs><radialGradient id='g' cx='50%' cy='50%' r='70%'>"
        "<stop offset='0%' stop-color='#2A1F0F'/><stop offset='100%' stop-color='#1A1510'/></radialGradient></defs>"
        "<rect width='800' height='800' fill='url(#g)'/>"
        "<circle cx='400' cy='400' r='220' fill='none' stroke='#C9A84C' stroke-width='1' opacity='0.4'/>"
        "<circle cx='400' cy='400' r='160' fill='none' stroke='#E8C97A' stroke-width='1' opacity='0.6'/>"
        "<text x='400' y='430' text-anchor='middle' font-family='Cormorant Garamond, serif' font-size='120' fill='#E8C97A'>Da Fruito</text>"
        "<text x='400' y='480' text-anchor='middle' font-family='Josefin Sans, sans-serif' font-size='16' letter-spacing='4' fill='#C9A84C'>YOUR BESPOKE HAMPER</text>"
        "</svg>"
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


# ===================== Routes: Admin =====================
@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    today_rev = sum(o.get("total", 0) for o in orders if o.get("created_at", "").startswith(today))
    month_rev = sum(o.get("total", 0) for o in orders if o.get("created_at", "").startswith(month))
    pending = sum(1 for o in orders if o.get("status", "").lower().startswith("pending"))
    in_stock = await db.products.count_documents({"in_stock": True})
    out_of_stock = await db.products.count_documents({"in_stock": False})
    return {
        "revenue_today": today_rev,
        "revenue_month": month_rev,
        "total_orders": len(orders),
        "pending_orders": pending,
        "products_in_stock": in_stock,
        "out_of_stock": out_of_stock,
        "recent_orders": sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:10],
    }


@api_router.get("/admin/orders")
async def admin_orders(admin=Depends(require_admin), status_filter: Optional[str] = Query(None, alias="status")):
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
    await db.orders.update_one({"id": order_id}, {"$set": {"status": new_status, "updated_at": now_iso()}})
    return {"ok": True}


@api_router.post("/admin/products")
async def admin_add_product(body: Dict[str, Any], admin=Depends(require_admin)):
    p = Product(**{k: v for k, v in body.items() if k in Product.model_fields})
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


# ===================== Seed =====================
SEED_VESSELS = [
    {"name": "Hand-Turned Ceramic Bowl", "material": "Ivory Glazed Ceramic", "capacity_s": 2, "capacity_m": 3, "capacity_l": 4, "price": 1800, "image": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80", "description": "Hand-turned by Jaipur artisans, rimmed with a whisper of gold lustre."},
    {"name": "Walnut Wood Caddy", "material": "Reclaimed Walnut", "capacity_s": 3, "capacity_m": 5, "capacity_l": 7, "price": 2400, "image": "https://images.unsplash.com/photo-1513267048331-5611cad62e41?w=1200&q=80", "description": "Rich, grainful walnut polished with beeswax — heirloom quality."},
    {"name": "Antique Silver Tray", "material": "German Silver", "capacity_s": 4, "capacity_m": 6, "capacity_l": 9, "price": 3200, "image": "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1200&q=80", "description": "Hand-hammered edge, warm antique patina — a timeless canvas."},
    {"name": "Jute Heritage Basket", "material": "Hand-Woven Jute", "capacity_s": 5, "capacity_m": 8, "capacity_l": 12, "price": 1200, "image": "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=1200&q=80", "description": "Soft, natural fibre — the texture of slow craft."},
    {"name": "Mango Wood Crate", "material": "Hand-Sanded Mango Wood", "capacity_s": 6, "capacity_m": 9, "capacity_l": 14, "price": 1600, "image": "https://images.unsplash.com/photo-1549488344-cbb6c34de5d7?w=1200&q=80", "description": "Sun-bleached and oil-finished — rustic luxury."},
    {"name": "Marble Keepsake Box", "material": "Makrana Marble", "capacity_s": 2, "capacity_m": 3, "capacity_l": 5, "price": 3800, "image": "https://images.unsplash.com/photo-1608142737432-b0a0bed6fdee?w=1200&q=80", "description": "Cool, veined, substantial — the gift that lingers."},
]

SEED_PRODUCTS = [
    # Chocolates
    {"name": "Belgian Dark Truffles", "category": "chocolates", "country": "Belgium", "price": 1200, "image": "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=800&q=80", "weight_grams": 150},
    {"name": "Single-Origin Madagascar Bar", "category": "chocolates", "country": "Madagascar", "price": 850, "image": "https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&q=80", "weight_grams": 100},
    {"name": "Champagne Gold Truffles", "category": "chocolates", "country": "France", "price": 1600, "image": "https://images.unsplash.com/photo-1582005450386-52b25f82d9bf?w=800&q=80", "weight_grams": 180},
    {"name": "Swiss Praline Selection", "category": "chocolates", "country": "Switzerland", "price": 1400, "image": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&q=80", "weight_grams": 160},
    # Biscuits
    {"name": "Scottish Shortbread Fingers", "category": "biscuits", "country": "Scotland", "price": 680, "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80", "weight_grams": 200},
    {"name": "Florentine Almond Thins", "category": "biscuits", "country": "Italy", "price": 720, "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80", "weight_grams": 150},
    {"name": "French Butter Palmiers", "category": "biscuits", "country": "France", "price": 640, "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=800&q=80", "weight_grams": 180},
    # Teas
    {"name": "Darjeeling First Flush", "category": "teas", "country": "India", "price": 950, "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80", "weight_grams": 100},
    {"name": "Japanese Gyokuro Green", "category": "teas", "country": "Japan", "price": 1800, "image": "https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?w=800&q=80", "weight_grams": 80},
    {"name": "Earl Grey Royale", "category": "teas", "country": "England", "price": 780, "image": "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800&q=80", "weight_grams": 100},
    # Preserves
    {"name": "Rose Petal Preserve", "category": "preserves", "country": "Bulgaria", "price": 820, "image": "https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=800&q=80", "weight_grams": 250},
    {"name": "Seville Orange Marmalade", "category": "preserves", "country": "Spain", "price": 680, "image": "https://images.unsplash.com/photo-1597916829826-02e5bb4a54e0?w=800&q=80", "weight_grams": 300},
    {"name": "Acacia Wildflower Honey", "category": "preserves", "country": "Italy", "price": 1200, "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80", "weight_grams": 250},
    # Nuts
    {"name": "Marcona Almonds", "category": "nuts", "country": "Spain", "price": 1100, "image": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80", "weight_grams": 200},
    {"name": "Sicilian Pistachios", "category": "nuts", "country": "Italy", "price": 1400, "image": "https://images.unsplash.com/photo-1599599810694-b5b37c2c2b35?w=800&q=80", "weight_grams": 180},
    {"name": "Honey-Roasted Cashews", "category": "nuts", "country": "India", "price": 880, "image": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80", "weight_grams": 200},
    # Wines
    {"name": "French Rosé Champagne", "category": "wines", "country": "France", "price": 6800, "image": "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=800&q=80", "weight_grams": 750},
    {"name": "Italian Prosecco Brut", "category": "wines", "country": "Italy", "price": 3200, "image": "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80", "weight_grams": 750},
    # Specialty
    {"name": "Saffron Threads (Kashmiri)", "category": "specialty", "country": "India", "price": 2200, "image": "https://images.unsplash.com/photo-1599909533730-ebe77a2cc24d?w=800&q=80", "weight_grams": 10},
    {"name": "Sicilian Black Truffle Paste", "category": "specialty", "country": "Italy", "price": 2800, "image": "https://images.unsplash.com/photo-1618775930953-6ea01ecaea48?w=800&q=80", "weight_grams": 80},
]

SEED_HAMPERS = [
    {"name": "The Everlasting Bonds", "occasion": "anniversary", "price": 7800, "image": "https://images.unsplash.com/photo-1732928730431-11c206639a38?w=1200&q=80", "description": "A ceremony in a ceramic vessel. Single-origin chocolates, first-flush tea, and a handwritten note.", "materials": ["Ceramic", "Silk Ribbon"], "items": ["Belgian Dark Truffles", "Darjeeling First Flush", "Acacia Wildflower Honey"]},
    {"name": "The Celebration Edit", "occasion": "birthday", "price": 5400, "image": "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&q=80", "description": "Playful and indulgent — champagne truffles, shortbread, and toasted almonds.", "materials": ["Walnut Wood", "Gold Ribbon"], "items": ["Champagne Gold Truffles", "Scottish Shortbread Fingers", "Marcona Almonds"]},
    {"name": "The Festive Heirloom", "occasion": "festive", "price": 9200, "image": "https://images.unsplash.com/photo-1732928729959-2e8fdb5a5cd7?w=1200&q=80", "description": "A Diwali and winter-festive hamper — saffron, preserves, and wine.", "materials": ["Silver", "Brocade"], "items": ["Saffron Threads (Kashmiri)", "Rose Petal Preserve", "French Rosé Champagne"]},
    {"name": "The Corporate Gesture", "occasion": "corporate", "price": 6400, "image": "https://images.unsplash.com/photo-1549488344-cbb6c34de5d7?w=1200&q=80", "description": "Refined, restrained, memorable — for boardrooms and handshakes.", "materials": ["Marble", "Linen"], "items": ["Single-Origin Madagascar Bar", "Earl Grey Royale", "Florentine Almond Thins"]},
    {"name": "The Sage Tea Ritual", "occasion": "wellness", "price": 4200, "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&q=80", "description": "A slow morning — gyokuro, acacia honey, and shortbread.", "materials": ["Ceramic", "Jute"], "items": ["Japanese Gyokuro Green", "Acacia Wildflower Honey", "Scottish Shortbread Fingers"]},
    {"name": "The Housewarming Welcome", "occasion": "housewarming", "price": 5800, "image": "https://images.unsplash.com/photo-1647168672642-695e96782922?w=1200&q=80", "description": "A new home deserves a warm beginning — preserves, nuts, and prosecco.", "materials": ["Jute", "Mango Wood"], "items": ["Seville Orange Marmalade", "Sicilian Pistachios", "Italian Prosecco Brut"]},
]


@app.on_event("startup")
async def seed_data():
    if await db.vessels.count_documents({}) == 0:
        docs = [Vessel(**v).model_dump() for v in SEED_VESSELS]
        await db.vessels.insert_many(docs)
        logger.info(f"Seeded {len(docs)} vessels")
    if await db.products.count_documents({}) == 0:
        docs = [Product(**p).model_dump() for p in SEED_PRODUCTS]
        await db.products.insert_many(docs)
        logger.info(f"Seeded {len(docs)} products")
    if await db.hampers.count_documents({}) == 0:
        docs = [Hamper(**h).model_dump() for h in SEED_HAMPERS]
        await db.hampers.insert_many(docs)
        logger.info(f"Seeded {len(docs)} hampers")
    # default admin
    if await db.users.count_documents({}) == 0:
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@dafruito.com",
            "name": "Da Fruito Admin",
            "password": hash_password("admin123"),
            "role": "admin",
            "addresses": [],
            "created_at": now_iso(),
        }
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
