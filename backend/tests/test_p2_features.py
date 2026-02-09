"""
Test P2 features: Export All Data, Advanced Sharing Permissions, 2FA
"""
import pytest
import requests
import os
import io
import zipfile
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "password"


class TestAuth:
    """Authentication for testing"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}


class TestExportAllData(TestAuth):
    """Test /api/export/all endpoint - ZIP download"""
    
    def test_export_all_returns_zip(self, auth_headers):
        """Test that export/all endpoint returns a ZIP file"""
        response = requests.get(
            f"{BASE_URL}/api/export/all",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Export failed: {response.text}"
        
        # Check content type is ZIP
        content_type = response.headers.get('content-type', '')
        assert 'application/zip' in content_type or 'application/x-zip' in content_type, \
            f"Expected ZIP content type, got: {content_type}"
    
    def test_export_all_valid_zip_structure(self, auth_headers):
        """Test that ZIP file contains expected JSON files"""
        response = requests.get(
            f"{BASE_URL}/api/export/all",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Parse ZIP content
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as zf:
            file_names = zf.namelist()
            
            # Check required files exist
            expected_files = ['account.json', 'children.json', 'journals.json', 
                            'violations.json', 'calendar.json', 'contacts.json']
            for expected in expected_files:
                assert expected in file_names, f"Missing {expected} in ZIP"
            
            # Verify account.json is valid JSON
            account_data = json.loads(zf.read('account.json'))
            assert 'email' in account_data, "account.json missing email"
            assert 'full_name' in account_data, "account.json missing full_name"
            assert 'exported_at' in account_data, "account.json missing exported_at"
    
    def test_export_requires_auth(self):
        """Test that export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/export/all")
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without auth, got: {response.status_code}"


class TestTwoFactorAuth(TestAuth):
    """Test 2FA endpoints"""
    
    def test_2fa_status_endpoint(self, auth_headers):
        """Test GET /api/auth/2fa/status"""
        response = requests.get(
            f"{BASE_URL}/api/auth/2fa/status",
            headers=auth_headers
        )
        assert response.status_code == 200, f"2FA status failed: {response.text}"
        
        data = response.json()
        assert 'enabled' in data, "Response missing 'enabled' field"
        assert isinstance(data['enabled'], bool), "'enabled' should be boolean"
    
    def test_2fa_enable(self, auth_headers):
        """Test POST /api/auth/2fa/enable"""
        response = requests.post(
            f"{BASE_URL}/api/auth/2fa/enable",
            headers=auth_headers
        )
        assert response.status_code == 200, f"2FA enable failed: {response.text}"
        
        data = response.json()
        assert data.get('status') == 'success', "Expected success status"
        
        # Verify status changed
        status_response = requests.get(
            f"{BASE_URL}/api/auth/2fa/status",
            headers=auth_headers
        )
        assert status_response.json()['enabled'] == True, "2FA should be enabled"
    
    def test_2fa_disable(self, auth_headers):
        """Test POST /api/auth/2fa/disable"""
        response = requests.post(
            f"{BASE_URL}/api/auth/2fa/disable",
            headers=auth_headers
        )
        assert response.status_code == 200, f"2FA disable failed: {response.text}"
        
        data = response.json()
        assert data.get('status') == 'success', "Expected success status"
        
        # Verify status changed
        status_response = requests.get(
            f"{BASE_URL}/api/auth/2fa/status",
            headers=auth_headers
        )
        assert status_response.json()['enabled'] == False, "2FA should be disabled"
    
    def test_2fa_send_code_endpoint(self):
        """Test POST /api/auth/2fa/send-code"""
        # First enable 2FA for the user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
        requests.post(
            f"{BASE_URL}/api/auth/2fa/enable",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Test send code endpoint (using form data)
        response = requests.post(
            f"{BASE_URL}/api/auth/2fa/send-code",
            data={"email": TEST_EMAIL}
        )
        assert response.status_code == 200, f"Send code failed: {response.text}"
        
        data = response.json()
        assert 'status' in data, "Response missing status"
        
        # Disable 2FA after test
        requests.post(
            f"{BASE_URL}/api/auth/2fa/disable",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    def test_2fa_verify_invalid_code(self):
        """Test 2FA verify with invalid code"""
        response = requests.post(
            f"{BASE_URL}/api/auth/2fa/verify",
            data={"email": TEST_EMAIL, "code": "000000"}
        )
        # Should fail with invalid code
        assert response.status_code in [401, 400], \
            f"Should reject invalid code, got: {response.status_code}"


class TestAdvancedSharingPermissions(TestAuth):
    """Test share token with permission levels"""
    
    def test_create_share_token_with_permission_level(self, auth_headers):
        """Test creating share token with different permission levels"""
        # Test read_only permission
        response = requests.post(
            f"{BASE_URL}/api/share/tokens",
            json={
                "name": "TEST_Attorney_ViewOnly",
                "expires_days": 7,
                "include_journals": True,
                "include_violations": True,
                "include_documents": False,
                "include_calendar": False,
                "permission_level": "read_only"
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Create token failed: {response.text}"
        
        data = response.json()
        assert data['permission_level'] == 'read_only', "Permission level mismatch"
        assert 'share_token' in data, "Missing share_token"
        token_id = data['token_id']
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/share/tokens/{token_id}", headers=auth_headers)
    
    def test_create_share_token_read_print(self, auth_headers):
        """Test creating share token with read_print permission"""
        response = requests.post(
            f"{BASE_URL}/api/share/tokens",
            json={
                "name": "TEST_Attorney_ReadPrint",
                "expires_days": 14,
                "include_journals": True,
                "include_violations": True,
                "include_documents": True,
                "include_calendar": True,
                "permission_level": "read_print"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['permission_level'] == 'read_print'
        token_id = data['token_id']
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/share/tokens/{token_id}", headers=auth_headers)
    
    def test_create_share_token_full_access(self, auth_headers):
        """Test creating share token with read_print_download permission"""
        response = requests.post(
            f"{BASE_URL}/api/share/tokens",
            json={
                "name": "TEST_Attorney_FullAccess",
                "expires_days": 30,
                "include_journals": True,
                "include_violations": True,
                "include_documents": True,
                "include_calendar": True,
                "permission_level": "read_print_download"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['permission_level'] == 'read_print_download'
        token_id = data['token_id']
        share_token = data['share_token']
        
        # Test shared view returns permission level
        shared_response = requests.get(f"{BASE_URL}/api/shared/{share_token}")
        assert shared_response.status_code == 200
        shared_data = shared_response.json()
        assert shared_data['permission_level'] == 'read_print_download', \
            f"Shared view should have permission_level, got: {shared_data.get('permission_level')}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/share/tokens/{token_id}", headers=auth_headers)
    
    def test_get_share_tokens_includes_permission(self, auth_headers):
        """Test that GET /api/share/tokens includes permission_level"""
        # Create a token first
        create_response = requests.post(
            f"{BASE_URL}/api/share/tokens",
            json={
                "name": "TEST_Check_Permission",
                "expires_days": 7,
                "include_journals": True,
                "include_violations": False,
                "include_documents": False,
                "include_calendar": False,
                "permission_level": "read_print"
            },
            headers=auth_headers
        )
        token_id = create_response.json()['token_id']
        
        # Get all tokens
        response = requests.get(
            f"{BASE_URL}/api/share/tokens",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        tokens = response.json()
        assert len(tokens) > 0, "Should have at least one token"
        
        # Find our test token
        test_token = next((t for t in tokens if t['token_id'] == token_id), None)
        assert test_token is not None, "Test token not found"
        assert 'permission_level' in test_token, "Token should have permission_level"
        assert test_token['permission_level'] == 'read_print'
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/share/tokens/{token_id}", headers=auth_headers)


class TestSharedViewPermissions(TestAuth):
    """Test that shared view respects permission levels"""
    
    def test_shared_view_read_only(self, auth_headers):
        """Test shared view with read_only permission"""
        # Create token with read_only
        response = requests.post(
            f"{BASE_URL}/api/share/tokens",
            json={
                "name": "TEST_SharedView_ReadOnly",
                "expires_days": 7,
                "include_journals": True,
                "include_violations": True,
                "include_documents": False,
                "include_calendar": False,
                "permission_level": "read_only"
            },
            headers=auth_headers
        )
        data = response.json()
        token_id = data['token_id']
        share_token = data['share_token']
        
        # Access shared view
        shared_response = requests.get(f"{BASE_URL}/api/shared/{share_token}")
        assert shared_response.status_code == 200
        
        shared_data = shared_response.json()
        assert shared_data['permission_level'] == 'read_only'
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/share/tokens/{token_id}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
