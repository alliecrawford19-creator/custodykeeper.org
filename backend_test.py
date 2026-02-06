#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FamilyCourtAPITester:
    def __init__(self, base_url="https://continue-point.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if not files:
            headers['Content-Type'] = 'application/json'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers={k:v for k,v in headers.items() if k != 'Content-Type'})
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_auth_flow(self):
        """Test authentication flow"""
        print("\n🔐 Testing Authentication...")
        
        # Test registration with existing user (should fail)
        result = self.run_test(
            "Register existing user",
            "POST",
            "auth/register",
            400,  # Should fail
            {
                "email": "testuser@example.com",
                "password": "password123",
                "full_name": "Test User",
                "state": "California"
            }
        )
        
        # Test login with correct credentials
        result = self.run_test(
            "Login with valid credentials",
            "POST",
            "auth/login",
            200,
            {
                "email": "testuser@example.com",
                "password": "password123"
            }
        )
        
        if result and 'access_token' in result:
            self.token = result['access_token']
            self.user_id = result['user']['user_id']
            
            # Test get current user
            self.run_test(
                "Get current user info",
                "GET",
                "auth/me",
                200
            )
        
        # Test login with invalid credentials
        self.run_test(
            "Login with invalid credentials",
            "POST",
            "auth/login",
            401,
            {
                "email": "testuser@example.com",
                "password": "wrongpassword"
            }
        )

    def test_children_management(self):
        """Test children management"""
        print("\n👶 Testing Children Management...")
        
        if not self.token:
            print("Skipping children tests - no auth token")
            return
        
        # Create a child
        child_data = {
            "name": "Test Child",
            "date_of_birth": "2015-05-15",
            "notes": "Test child for API testing"
        }
        
        result = self.run_test(
            "Create child",
            "POST",
            "children",
            200,
            child_data
        )
        
        child_id = None
        if result and 'child_id' in result:
            child_id = result['child_id']
        
        # Get all children
        self.run_test(
            "Get all children",
            "GET",
            "children",
            200
        )
        
        # Delete child if created
        if child_id:
            self.run_test(
                "Delete child",
                "DELETE",
                f"children/{child_id}",
                200
            )

    def test_journal_management(self):
        """Test journal management"""
        print("\n📖 Testing Journal Management...")
        
        if not self.token:
            print("Skipping journal tests - no auth token")
            return
        
        # Create a journal entry
        journal_data = {
            "title": "Test Journal Entry",
            "content": "This is a test journal entry for API testing.",
            "date": "2024-01-15",
            "children_involved": [],
            "mood": "happy",
            "location": "Home"
        }
        
        result = self.run_test(
            "Create journal entry",
            "POST",
            "journals",
            200,
            journal_data
        )
        
        journal_id = None
        if result and 'journal_id' in result:
            journal_id = result['journal_id']
        
        # Get all journals
        self.run_test(
            "Get all journals",
            "GET",
            "journals",
            200
        )
        
        # Get specific journal
        if journal_id:
            self.run_test(
                "Get specific journal",
                "GET",
                f"journals/{journal_id}",
                200
            )
            
            # Update journal
            updated_data = journal_data.copy()
            updated_data['title'] = "Updated Test Journal"
            
            self.run_test(
                "Update journal entry",
                "PUT",
                f"journals/{journal_id}",
                200,
                updated_data
            )
            
            # Delete journal
            self.run_test(
                "Delete journal entry",
                "DELETE",
                f"journals/{journal_id}",
                200
            )

    def test_violations_management(self):
        """Test violations management"""
        print("\n⚠️ Testing Violations Management...")
        
        if not self.token:
            print("Skipping violations tests - no auth token")
            return
        
        # Create a violation
        violation_data = {
            "title": "Test Violation",
            "description": "This is a test violation for API testing.",
            "date": "2024-01-15",
            "violation_type": "schedule_violation",
            "severity": "medium",
            "witnesses": "Test witness",
            "evidence_notes": "Test evidence notes"
        }
        
        result = self.run_test(
            "Create violation",
            "POST",
            "violations",
            200,
            violation_data
        )
        
        violation_id = None
        if result and 'violation_id' in result:
            violation_id = result['violation_id']
        
        # Get all violations
        self.run_test(
            "Get all violations",
            "GET",
            "violations",
            200
        )
        
        # Get specific violation
        if violation_id:
            self.run_test(
                "Get specific violation",
                "GET",
                f"violations/{violation_id}",
                200
            )
            
            # Delete violation
            self.run_test(
                "Delete violation",
                "DELETE",
                f"violations/{violation_id}",
                200
            )

    def test_calendar_management(self):
        """Test calendar management"""
        print("\n📅 Testing Calendar Management...")
        
        if not self.token:
            print("Skipping calendar tests - no auth token")
            return
        
        # Create a calendar event
        event_data = {
            "title": "Test Parenting Time",
            "start_date": "2024-02-15",
            "end_date": "2024-02-15",
            "event_type": "parenting_time",
            "children_involved": [],
            "notes": "Test event",
            "location": "Home",
            "recurring": False
        }
        
        result = self.run_test(
            "Create calendar event",
            "POST",
            "calendar",
            200,
            event_data
        )
        
        event_id = None
        if result and 'event_id' in result:
            event_id = result['event_id']
        
        # Get all events
        self.run_test(
            "Get all calendar events",
            "GET",
            "calendar",
            200
        )
        
        # Update and delete event
        if event_id:
            updated_data = event_data.copy()
            updated_data['title'] = "Updated Test Event"
            
            self.run_test(
                "Update calendar event",
                "PUT",
                f"calendar/{event_id}",
                200,
                updated_data
            )
            
            self.run_test(
                "Delete calendar event",
                "DELETE",
                f"calendar/{event_id}",
                200
            )

    def test_documents_management(self):
        """Test documents management"""
        print("\n📄 Testing Documents Management...")
        
        if not self.token:
            print("Skipping documents tests - no auth token")
            return
        
        # Create a test file
        test_content = b"This is a test PDF content for API testing."
        
        # Upload document
        files = {'file': ('test.pdf', test_content, 'application/pdf')}
        data = {
            'category': 'court_order',
            'description': 'Test document upload'
        }
        
        result = self.run_test(
            "Upload document",
            "POST",
            "documents",
            200,
            data=data,
            files=files
        )
        
        document_id = None
        if result and 'document_id' in result:
            document_id = result['document_id']
        
        # Get all documents
        self.run_test(
            "Get all documents",
            "GET",
            "documents",
            200
        )
        
        # Download and delete document
        if document_id:
            self.run_test(
                "Download document",
                "GET",
                f"documents/{document_id}/download",
                200
            )
            
            self.run_test(
                "Delete document",
                "DELETE",
                f"documents/{document_id}",
                200
            )

    def test_state_laws(self):
        """Test state laws endpoints"""
        print("\n⚖️ Testing State Laws...")
        
        # Get all state laws (no auth required)
        self.run_test(
            "Get all state laws",
            "GET",
            "state-laws",
            200
        )
        
        # Get specific state law
        self.run_test(
            "Get California state law",
            "GET",
            "state-laws/California",
            200
        )
        
        # Test invalid state
        self.run_test(
            "Get invalid state law",
            "GET",
            "state-laws/InvalidState",
            404
        )

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        print("\n📊 Testing Dashboard Stats...")
        
        if not self.token:
            print("Skipping dashboard tests - no auth token")
            return
        
        self.run_test(
            "Get dashboard stats",
            "GET",
            "dashboard/stats",
            200
        )

    def test_export_functionality(self):
        """Test export functionality"""
        print("\n📤 Testing Export Functionality...")
        
        if not self.token:
            print("Skipping export tests - no auth token")
            return
        
        self.run_test(
            "Export journals",
            "GET",
            "export/journals",
            200
        )
        
        self.run_test(
            "Export violations",
            "GET",
            "export/violations",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Family Court API Tests...")
        print(f"Testing against: {self.base_url}")
        
        self.test_auth_flow()
        self.test_children_management()
        self.test_journal_management()
        self.test_violations_management()
        self.test_calendar_management()
        self.test_documents_management()
        self.test_state_laws()
        self.test_dashboard_stats()
        self.test_export_functionality()
        
        # Print summary
        print(f"\n📋 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = FamilyCourtAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())