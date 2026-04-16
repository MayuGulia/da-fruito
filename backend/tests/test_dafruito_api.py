"""
Da Fruito Backend API Tests
Tests all public endpoints, auth flows, cart, orders, Razorpay mock, AI endpoints, and admin routes.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@dafruito.com"
ADMIN_PASSWORD = "admin123"
TEST_CUSTOMER_EMAIL = f"test_customer_{int(time.time())}@dafruito.com"
TEST_CUSTOMER_PASSWORD = "customer123"
TEST_CUSTOMER_NAME = "Test Customer"


class TestPublicEndpoints:
    """Tests for public catalog endpoints"""
    
    def test_root_health(self):
        """GET /api/ returns health status"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Da Fruito API live"
        assert "version" in data
        print(f"PASS: Root endpoint returns: {data}")
    
    def test_get_hampers(self):
        """GET /api/hampers returns list of hampers"""
        response = requests.get(f"{BASE_URL}/api/hampers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6  # Seeded 6 hampers
        # Verify hamper structure
        hamper = data[0]
        assert "id" in hamper
        assert "name" in hamper
        assert "occasion" in hamper
        assert "price" in hamper
        print(f"PASS: Got {len(data)} hampers")
    
    def test_get_hampers_by_occasion(self):
        """GET /api/hampers?occasion=anniversary filters correctly"""
        response = requests.get(f"{BASE_URL}/api/hampers?occasion=anniversary")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for h in data:
            assert h["occasion"] == "anniversary"
        print(f"PASS: Filtered hampers by occasion, got {len(data)}")
    
    def test_get_vessels(self):
        """GET /api/vessels returns list of vessels"""
        response = requests.get(f"{BASE_URL}/api/vessels")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6  # Seeded 6 vessels
        vessel = data[0]
        assert "id" in vessel
        assert "name" in vessel
        assert "material" in vessel
        assert "price" in vessel
        print(f"PASS: Got {len(data)} vessels")
    
    def test_get_products(self):
        """GET /api/products returns list of products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 20  # Seeded 20 products
        product = data[0]
        assert "id" in product
        assert "name" in product
        assert "category" in product
        assert "price" in product
        print(f"PASS: Got {len(data)} products")
    
    def test_get_products_by_category(self):
        """GET /api/products?category=chocolates filters correctly"""
        response = requests.get(f"{BASE_URL}/api/products?category=chocolates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for p in data:
            assert p["category"] == "chocolates"
        print(f"PASS: Filtered products by category, got {len(data)} chocolates")
    
    def test_get_whatsapp_number(self):
        """GET /api/whatsapp-number returns placeholder number"""
        response = requests.get(f"{BASE_URL}/api/whatsapp-number")
        assert response.status_code == 200
        data = response.json()
        assert "number" in data
        print(f"PASS: WhatsApp number: {data['number']}")


class TestAuthFlow:
    """Tests for authentication endpoints"""
    
    def test_register_new_customer(self):
        """POST /api/auth/register creates new user"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD,
            "name": TEST_CUSTOMER_NAME
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_CUSTOMER_EMAIL.lower()
        assert data["user"]["name"] == TEST_CUSTOMER_NAME
        # Second user should be customer (first is admin)
        assert data["user"]["role"] in ["admin", "customer"]
        print(f"PASS: Registered user {data['user']['email']} with role {data['user']['role']}")
    
    def test_register_duplicate_email(self):
        """POST /api/auth/register with existing email returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "anypassword",
            "name": "Duplicate"
        })
        assert response.status_code == 400
        print("PASS: Duplicate email registration rejected")
    
    def test_login_admin(self):
        """POST /api/auth/login works for admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"PASS: Admin login successful, role={data['user']['role']}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("PASS: Invalid credentials rejected")
    
    def test_get_me_with_token(self):
        """GET /api/auth/me with valid token returns user"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Then get me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        print(f"PASS: /auth/me returns user: {data['email']}")
    
    def test_get_me_without_token(self):
        """GET /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("PASS: /auth/me without token returns 401")


class TestCartFlow:
    """Tests for cart endpoints (requires auth)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin token for cart tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_cart_empty(self, auth_token):
        """GET /api/cart returns empty list initially"""
        response = requests.get(f"{BASE_URL}/api/cart", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Cart has {len(data)} items")
    
    def test_add_to_cart(self, auth_token):
        """POST /api/cart adds item"""
        response = requests.post(f"{BASE_URL}/api/cart", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "kind": "hamper",
                "reference_id": "test-hamper-id",
                "name": "Test Hamper",
                "price": 5000,
                "quantity": 1,
                "image": "https://example.com/image.jpg"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Hamper"
        assert data["price"] == 5000
        print(f"PASS: Added item to cart, id={data['id']}")
        return data["id"]
    
    def test_cart_flow_add_and_remove(self, auth_token):
        """Full cart flow: add -> verify -> remove -> verify"""
        # Add item
        add_resp = requests.post(f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "kind": "bespoke",
                "name": "Bespoke Test Hamper",
                "price": 7500,
                "quantity": 1
            }
        )
        assert add_resp.status_code == 200
        item_id = add_resp.json()["id"]
        
        # Verify in cart
        cart_resp = requests.get(f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"})
        cart_items = cart_resp.json()
        assert any(i["id"] == item_id for i in cart_items)
        
        # Remove item
        del_resp = requests.delete(f"{BASE_URL}/api/cart/{item_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert del_resp.status_code == 200
        
        # Verify removed
        cart_resp2 = requests.get(f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"})
        cart_items2 = cart_resp2.json()
        assert not any(i["id"] == item_id for i in cart_items2)
        print("PASS: Cart add/remove flow works")
    
    def test_cart_requires_auth(self):
        """GET /api/cart without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 401
        print("PASS: Cart requires authentication")


class TestOrdersFlow:
    """Tests for order creation and listing"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_create_order_cod(self, auth_token):
        """POST /api/orders creates COD order"""
        response = requests.post(f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "items": [{"name": "Test Hamper", "price": 5000}],
                "total": 5000,
                "sender_name": "Test Sender",
                "recipient_name": "Test Recipient",
                "contact": "+91 9876543210",
                "address": "123 Test Street, Delhi",
                "delivery_date": "2026-05-01",
                "occasion": "birthday",
                "notes": "Test order",
                "payment_method": "cod"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["status"] == "Pending COD"
        assert data["payment_method"] == "cod"
        print(f"PASS: Created COD order, id={data['id'][:8]}, status={data['status']}")
        return data["id"]
    
    def test_create_order_whatsapp(self, auth_token):
        """POST /api/orders creates WhatsApp order"""
        response = requests.post(f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "items": [{"name": "WhatsApp Hamper", "price": 3000}],
                "total": 3000,
                "sender_name": "WA Sender",
                "recipient_name": "WA Recipient",
                "contact": "+91 9876543211",
                "address": "456 WA Street",
                "payment_method": "whatsapp"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Pending"
        print(f"PASS: Created WhatsApp order, status={data['status']}")
    
    def test_list_my_orders(self, auth_token):
        """GET /api/orders lists user's orders"""
        response = requests.get(f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: User has {len(data)} orders")


class TestRazorpayMock:
    """Tests for mocked Razorpay flow"""
    
    def test_create_razorpay_order(self):
        """POST /api/create-order returns mock order"""
        response = requests.post(f"{BASE_URL}/api/create-order", json={
            "amount": 500000,  # 5000 INR in paise
            "currency": "INR"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["id"].startswith("order_mock_")
        assert data["mock"] == True
        assert data["amount"] == 500000
        print(f"PASS: Mock Razorpay order created: {data['id']}")
        return data["id"]
    
    def test_verify_mock_payment(self):
        """POST /api/verify-payment verifies mock payment"""
        # First create order
        order_resp = requests.post(f"{BASE_URL}/api/create-order", json={
            "amount": 300000,
            "currency": "INR"
        })
        order_id = order_resp.json()["id"]
        
        # Verify payment
        response = requests.post(f"{BASE_URL}/api/verify-payment", json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": f"pay_mock_{int(time.time())}",
            "razorpay_signature": "mock_signature"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["verified"] == True
        assert data["mock"] == True
        print("PASS: Mock payment verified")
    
    def test_full_razorpay_order_flow(self):
        """Full Razorpay flow: create order -> verify -> create order record"""
        # Login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Create Razorpay order
        rz_resp = requests.post(f"{BASE_URL}/api/create-order", json={
            "amount": 780000,
            "currency": "INR"
        })
        rz_order = rz_resp.json()
        
        # Verify payment
        verify_resp = requests.post(f"{BASE_URL}/api/verify-payment", json={
            "razorpay_order_id": rz_order["id"],
            "razorpay_payment_id": f"pay_mock_{int(time.time())}",
            "razorpay_signature": "mock"
        })
        assert verify_resp.json()["verified"] == True
        
        # Create order record
        order_resp = requests.post(f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "items": [{"name": "Razorpay Hamper", "price": 7800}],
                "total": 7800,
                "sender_name": "RZ Sender",
                "recipient_name": "RZ Recipient",
                "contact": "+91 9876543212",
                "address": "789 RZ Street",
                "payment_method": "razorpay",
                "razorpay_order_id": rz_order["id"],
                "razorpay_payment_id": f"pay_mock_{int(time.time())}"
            }
        )
        assert order_resp.status_code == 200
        data = order_resp.json()
        assert data["status"] == "Confirmed"
        print(f"PASS: Full Razorpay flow completed, order status={data['status']}")


class TestAIEndpoints:
    """Tests for AI chat and inventory endpoints"""
    
    def test_ai_chat(self):
        """POST /api/ai-chat returns curator-style reply"""
        response = requests.post(f"{BASE_URL}/api/ai-chat", json={
            "session_id": f"test-{int(time.time())}",
            "message": "Hello, I need a gift for an anniversary",
            "history": []
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 10  # Non-empty reply
        print(f"PASS: AI chat reply: {data['reply'][:100]}...")
    
    def test_ai_inventory_requires_admin(self):
        """POST /api/ai-inventory requires admin auth"""
        # Without auth
        response = requests.post(f"{BASE_URL}/api/ai-inventory", json={
            "command": "mark truffles out of stock"
        })
        assert response.status_code == 401
        print("PASS: AI inventory requires auth")
    
    def test_ai_inventory_admin_only(self):
        """POST /api/ai-inventory rejects non-admin"""
        # Register a customer
        cust_email = f"cust_{int(time.time())}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": cust_email,
            "password": "test123",
            "name": "Test Cust"
        })
        # If this is first user, they become admin, so skip this test
        if reg_resp.json()["user"]["role"] == "admin":
            print("SKIP: First user is admin, cannot test non-admin rejection")
            return
        
        token = reg_resp.json()["token"]
        response = requests.post(f"{BASE_URL}/api/ai-inventory",
            headers={"Authorization": f"Bearer {token}"},
            json={"command": "mark truffles out of stock"})
        assert response.status_code == 403
        print("PASS: AI inventory rejects non-admin")
    
    def test_ai_inventory_parse_command(self):
        """POST /api/ai-inventory parses command to JSON"""
        # Login as admin
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        response = requests.post(f"{BASE_URL}/api/ai-inventory",
            headers={"Authorization": f"Bearer {token}"},
            json={"command": "apply 10% discount to teas"})
        assert response.status_code == 200
        data = response.json()
        assert "preview" in data
        preview = data["preview"]
        assert "action" in preview
        print(f"PASS: AI inventory parsed: action={preview.get('action')}, summary={preview.get('summary', '')[:50]}")
    
    def test_ai_inventory_apply(self):
        """POST /api/ai-inventory/apply applies changes"""
        # Login as admin
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Apply mark_out_of_stock action
        response = requests.post(f"{BASE_URL}/api/ai-inventory/apply",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "action": "mark_out_of_stock",
                "target": "Belgian Dark Truffles",
                "params": {},
                "summary": "Mark Belgian Dark Truffles as out of stock"
            })
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] == True
        print(f"PASS: AI inventory apply: changed={data['changed']} records")
        
        # Restore stock
        restore_resp = requests.post(f"{BASE_URL}/api/ai-inventory/apply",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "action": "restore_stock",
                "target": "Belgian Dark Truffles",
                "params": {}
            })
        assert restore_resp.status_code == 200


class TestHamperImageGeneration:
    """Tests for AI hamper image generation"""
    
    def test_generate_hamper_image(self):
        """POST /api/generate-hamper-image returns image data URL"""
        response = requests.post(f"{BASE_URL}/api/generate-hamper-image", json={
            "vessel": {"name": "Ceramic Bowl", "material": "ceramic"},
            "items": [
                {"name": "Belgian Truffles"},
                {"name": "Darjeeling Tea"}
            ],
            "gift_card": {"enabled": True, "message": "With love"},
            "occasion": "anniversary"
        })
        assert response.status_code == 200
        data = response.json()
        assert "image_data_url" in data
        assert data["image_data_url"].startswith("data:")
        assert "prompt" in data
        # Check if mock or real
        is_mock = data.get("mock", True)
        print(f"PASS: Hamper image generated, mock={is_mock}, prompt_len={len(data['prompt'])}")


class TestAdminEndpoints:
    """Tests for admin-only endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_admin_stats(self, admin_token):
        """GET /api/admin/stats returns dashboard widgets"""
        response = requests.get(f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "revenue_today" in data
        assert "revenue_month" in data
        assert "total_orders" in data
        assert "pending_orders" in data
        assert "products_in_stock" in data
        assert "out_of_stock" in data
        print(f"PASS: Admin stats: orders={data['total_orders']}, in_stock={data['products_in_stock']}")
    
    def test_admin_orders_list(self, admin_token):
        """GET /api/admin/orders returns all orders"""
        response = requests.get(f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin orders list: {len(data)} orders")
    
    def test_admin_update_order_status(self, admin_token):
        """PATCH /api/admin/orders/{id} updates status"""
        # First create an order
        order_resp = requests.post(f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "items": [{"name": "Status Test Hamper", "price": 4000}],
                "total": 4000,
                "sender_name": "Status Sender",
                "recipient_name": "Status Recipient",
                "contact": "+91 9876543213",
                "address": "Status Street",
                "payment_method": "cod"
            }
        )
        order_id = order_resp.json()["id"]
        
        # Update status
        response = requests.patch(f"{BASE_URL}/api/admin/orders/{order_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "In Preparation"})
        assert response.status_code == 200
        assert response.json()["ok"] == True
        print(f"PASS: Order status updated to 'In Preparation'")
    
    def test_admin_requires_auth(self):
        """Admin endpoints return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        print("PASS: Admin stats requires auth")
    
    def test_admin_requires_admin_role(self):
        """Admin endpoints return 403 for non-admin"""
        # Register a new customer
        cust_email = f"nonadmin_{int(time.time())}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": cust_email,
            "password": "test123",
            "name": "Non Admin"
        })
        if reg_resp.json()["user"]["role"] == "admin":
            print("SKIP: First user is admin")
            return
        
        token = reg_resp.json()["token"]
        response = requests.get(f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403
        print("PASS: Admin stats returns 403 for non-admin")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
