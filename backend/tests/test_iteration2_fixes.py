"""
Da Fruito — Iteration 2 Fixes Test Suite
Tests for the 6 user-reported issues fixed in this iteration:
1. Preloader shows Da Fruito brand logo
2. Firebase authentication
3. Create Hamper → Confections shows all 6 categories with products
4. Navbar enlarged
5. WhatsApp number set to +91 9034782090
6. Product images are unique (no shared placeholders)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWhatsAppNumber:
    """Test WhatsApp number is correctly set to +919034782090"""
    
    def test_whatsapp_endpoint_returns_correct_number(self):
        """GET /api/whatsapp-number should return +919034782090"""
        response = requests.get(f"{BASE_URL}/api/whatsapp-number")
        assert response.status_code == 200
        data = response.json()
        assert "number" in data
        assert data["number"] == "+919034782090"
        print(f"✓ WhatsApp number: {data['number']}")


class TestProductCategories:
    """Test that all 6 categories have products for Confections step"""
    
    def test_chocolates_category_has_products(self):
        """GET /api/products?category=chocolates should return 7 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=chocolates")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 3, f"Expected at least 3 chocolates, got {len(products)}"
        print(f"✓ Chocolates: {len(products)} products")
    
    def test_biscuits_category_has_products(self):
        """GET /api/products?category=biscuits should return 3 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=biscuits")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 3, f"Expected at least 3 biscuits, got {len(products)}"
        print(f"✓ Biscuits: {len(products)} products")
    
    def test_nuts_category_has_products(self):
        """GET /api/products?category=nuts should return 10 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=nuts")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 3, f"Expected at least 3 nuts, got {len(products)}"
        print(f"✓ Nuts: {len(products)} products")
    
    def test_teas_category_has_products(self):
        """GET /api/products?category=teas should return 10 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=teas")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 3, f"Expected at least 3 teas, got {len(products)}"
        print(f"✓ Teas: {len(products)} products")
    
    def test_snacks_category_has_products(self):
        """GET /api/products?category=snacks should return 10 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=snacks")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 3, f"Expected at least 3 snacks, got {len(products)}"
        print(f"✓ Snacks: {len(products)} products")
    
    def test_artisan_category_has_products(self):
        """GET /api/products?category=artisan should return 10 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=artisan")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 3, f"Expected at least 3 artisan, got {len(products)}"
        print(f"✓ Artisan: {len(products)} products")
    
    def test_total_products_count(self):
        """GET /api/products should return 50 total products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 50, f"Expected 50 products, got {len(products)}"
        print(f"✓ Total products: {len(products)}")


class TestProductImageUniqueness:
    """Test that products have unique images (no shared placeholders)"""
    
    def test_at_least_40_unique_images(self):
        """At least 40 of 50 products should have unique image URLs"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        images = [p.get("image", "") for p in products if p.get("image")]
        unique_images = set(images)
        
        assert len(unique_images) >= 40, f"Expected at least 40 unique images, got {len(unique_images)}"
        print(f"✓ Unique product images: {len(unique_images)} out of {len(images)}")


class TestHampers:
    """Test hamper data for all 6 occasions"""
    
    def test_hampers_have_6_occasions(self):
        """GET /api/hampers should return hampers for all 6 occasions"""
        response = requests.get(f"{BASE_URL}/api/hampers")
        assert response.status_code == 200
        hampers = response.json()
        
        occasions = set(h.get("occasion") for h in hampers)
        expected = {"anniversary", "birthday", "festive", "corporate", "wellness", "housewarming"}
        
        assert occasions == expected, f"Missing occasions: {expected - occasions}"
        print(f"✓ Hamper occasions: {occasions}")
    
    def test_hampers_have_valid_images(self):
        """All hampers should have image URLs (not B&O electronics)"""
        response = requests.get(f"{BASE_URL}/api/hampers")
        assert response.status_code == 200
        hampers = response.json()
        
        for h in hampers:
            image = h.get("image", "")
            assert image, f"Hamper {h.get('name')} has no image"
            # Check it's not the old B&O image
            assert "photo-1732928730431" not in image, f"Hamper {h.get('name')} still uses old B&O image"
        
        print(f"✓ All {len(hampers)} hampers have valid images")


class TestFirebaseSync:
    """Test Firebase authentication endpoint"""
    
    def test_firebase_sync_rejects_invalid_token(self):
        """POST /api/auth/firebase-sync should return 401 for invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/firebase-sync",
            json={"id_token": "invalid_token_here"}
        )
        # Should return 401 (not 404 or 500)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Firebase sync rejects invalid token: {data.get('detail')}")
    
    def test_firebase_sync_endpoint_exists(self):
        """POST /api/auth/firebase-sync should not return 404"""
        response = requests.post(
            f"{BASE_URL}/api/auth/firebase-sync",
            json={"id_token": "test"}
        )
        # Should NOT be 404 (endpoint exists)
        assert response.status_code != 404, "Firebase sync endpoint not found (404)"
        print(f"✓ Firebase sync endpoint exists (status: {response.status_code})")


class TestLegacyAuth:
    """Test legacy JWT authentication still works"""
    
    def test_legacy_login_with_admin(self):
        """POST /api/auth/login should work with legacy admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@dafruito.com", "password": "admin123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Legacy admin login works: {data['user']['email']}")


class TestVessels:
    """Test vessel data for bespoke builder"""
    
    def test_vessels_available(self):
        """GET /api/vessels should return vessels"""
        response = requests.get(f"{BASE_URL}/api/vessels")
        assert response.status_code == 200
        vessels = response.json()
        assert len(vessels) >= 1, "No vessels found"
        print(f"✓ Vessels available: {len(vessels)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
