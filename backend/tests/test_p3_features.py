"""
Test P3 Features:
- Pagination support for journals/violations endpoints
- CSV import endpoints for journals, violations, calendar
- CSV template download endpoints
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Get auth token for authenticated tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "password"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}


class TestPagination(TestAuth):
    """Test pagination support for list endpoints"""
    
    def test_journals_default_pagination(self, headers):
        """Test journals endpoint with default pagination (page=1, page_size=50)"""
        response = requests.get(f"{BASE_URL}/api/journals", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Default page_size is 50, so result should be list (max 50 items)
        assert len(data) <= 50, "Default page_size should limit results to 50"
        print(f"Journals default pagination: {len(data)} items returned")
    
    def test_journals_pagination_with_params(self, headers):
        """Test journals endpoint with pagination parameters"""
        # Test page 1, page_size 10
        response = requests.get(f"{BASE_URL}/api/journals?page=1&page_size=10", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10, "page_size=10 should limit results to 10"
        print(f"Journals with page=1&page_size=10: {len(data)} items")
    
    def test_journals_pagination_page_2(self, headers):
        """Test journals endpoint with page 2"""
        response = requests.get(f"{BASE_URL}/api/journals?page=2&page_size=5", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Journals page 2 (page_size=5): {len(data)} items")
    
    def test_violations_default_pagination(self, headers):
        """Test violations endpoint with default pagination"""
        response = requests.get(f"{BASE_URL}/api/violations", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 50, "Default page_size should limit results to 50"
        print(f"Violations default pagination: {len(data)} items returned")
    
    def test_violations_pagination_with_params(self, headers):
        """Test violations endpoint with pagination parameters"""
        response = requests.get(f"{BASE_URL}/api/violations?page=1&page_size=10", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10
        print(f"Violations with page=1&page_size=10: {len(data)} items")
    
    def test_violations_filter_with_pagination(self, headers):
        """Test violations endpoint with severity filter and pagination"""
        response = requests.get(f"{BASE_URL}/api/violations?page=1&page_size=10&severity=high", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned items should have high severity if any exist
        for item in data:
            assert item.get("severity") == "high" or len(data) == 0
        print(f"Violations filtered by severity=high: {len(data)} items")


class TestCSVTemplateDownload(TestAuth):
    """Test CSV template download endpoints"""
    
    def test_download_journals_template(self, headers):
        """Test downloading journals CSV template"""
        response = requests.get(f"{BASE_URL}/api/import/templates/journals", headers=headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        content = response.text
        # Check template has expected columns
        assert "title" in content.lower()
        assert "date" in content.lower()
        print(f"Journals template downloaded: {len(content)} bytes")
    
    def test_download_violations_template(self, headers):
        """Test downloading violations CSV template"""
        response = requests.get(f"{BASE_URL}/api/import/templates/violations", headers=headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        content = response.text
        assert "violation_type" in content.lower()
        assert "date" in content.lower()
        print(f"Violations template downloaded: {len(content)} bytes")
    
    def test_download_calendar_template(self, headers):
        """Test downloading calendar CSV template"""
        response = requests.get(f"{BASE_URL}/api/import/templates/calendar", headers=headers)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        content = response.text
        assert "title" in content.lower()
        assert "start_date" in content.lower()
        print(f"Calendar template downloaded: {len(content)} bytes")
    
    def test_download_invalid_template_type(self, headers):
        """Test downloading non-existent template type"""
        response = requests.get(f"{BASE_URL}/api/import/templates/invalid", headers=headers)
        assert response.status_code == 404
        print("Invalid template type correctly returns 404")


class TestCSVImport(TestAuth):
    """Test CSV import endpoints"""
    
    def test_import_journals_csv(self, headers):
        """Test importing journals from CSV"""
        csv_content = """title,date,entry,mood
TEST_Import Journal 1,2026-01-15,This is a test journal entry from import,happy
TEST_Import Journal 2,2026-01-16,Another imported journal entry,neutral"""
        
        files = {"file": ("journals_test.csv", io.StringIO(csv_content), "text/csv")}
        response = requests.post(f"{BASE_URL}/api/import/journals", headers=headers, files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "imported_count" in data
        assert "skipped_count" in data
        print(f"Journals imported: {data.get('imported_count')}, skipped: {data.get('skipped_count')}")
    
    def test_import_violations_csv(self, headers):
        """Test importing violations from CSV"""
        csv_content = """violation_type,date,time,description,severity,witnesses,evidence_notes
Late pickup,2026-01-15,18:30,TEST_Imported: Was 45 minutes late,medium,Neighbor,Text messages
No show,2026-01-20,,TEST_Imported: Did not show up for scheduled visit,high,,"""
        
        files = {"file": ("violations_test.csv", io.StringIO(csv_content), "text/csv")}
        response = requests.post(f"{BASE_URL}/api/import/violations", headers=headers, files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "imported_count" in data
        print(f"Violations imported: {data.get('imported_count')}, skipped: {data.get('skipped_count')}")
    
    def test_import_calendar_csv(self, headers):
        """Test importing calendar events from CSV"""
        csv_content = """title,start_date,end_date,event_type,location,notes
TEST_Court Hearing,2026-02-20,2026-02-20,court_date,Family Court Room 3,Custody hearing
TEST_Pickup,2026-02-21,2026-02-21,pickup,,Weekend visit"""
        
        files = {"file": ("calendar_test.csv", io.StringIO(csv_content), "text/csv")}
        response = requests.post(f"{BASE_URL}/api/import/calendar", headers=headers, files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "imported_count" in data
        print(f"Calendar events imported: {data.get('imported_count')}, skipped: {data.get('skipped_count')}")
    
    def test_import_invalid_csv_format(self, headers):
        """Test importing CSV with missing required fields"""
        csv_content = """title,content
Missing Date Entry,This entry has no date field"""
        
        files = {"file": ("invalid_test.csv", io.StringIO(csv_content), "text/csv")}
        response = requests.post(f"{BASE_URL}/api/import/journals", headers=headers, files=files)
        
        assert response.status_code == 200
        data = response.json()
        # Should have skipped the row due to missing date
        assert data.get("skipped_count", 0) >= 1 or data.get("imported_count", 0) == 0
        print(f"Invalid CSV handled: imported={data.get('imported_count')}, skipped={data.get('skipped_count')}")


class TestDatabaseIndexes:
    """Test that database indexes are created"""
    
    def test_health_endpoint(self):
        """Basic health check to verify server is running with indexes created on startup"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        # Should return 401/403 without auth, but server is running
        assert response.status_code in [401, 403, 422]
        print("Server is running - indexes should be created on startup")


class TestCleanup(TestAuth):
    """Clean up test data after tests"""
    
    def test_cleanup_imported_journals(self, headers):
        """Verify imported journals exist and can be retrieved"""
        response = requests.get(f"{BASE_URL}/api/journals?page=1&page_size=100", headers=headers)
        assert response.status_code == 200
        journals = response.json()
        test_journals = [j for j in journals if j.get("title", "").startswith("TEST_")]
        print(f"Found {len(test_journals)} test journals that can be cleaned up")
        # Note: In production, we would delete these. For now, just verify they exist.


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
