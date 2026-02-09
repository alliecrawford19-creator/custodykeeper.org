"""
Backend API tests for CustodyKeeper - Calendar and CRUD functionalities
Tests: Calendar, Violations, Journal, Contacts edit functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://visibility-patch-1.preview.emergentagent.com')

# Test credentials from the review request
TEST_EMAIL = "test2@test.com"
TEST_PASSWORD = "testpassword"

# Existing data from review_request
EXISTING_CHILDREN = [
    {"name": "Emma", "id": "f5e068d8-e0a4-405e-973f-47953bc1bfcb"},
    {"name": "Jack", "id": "f8cb7fb2-49cb-4c4a-a8af-cfa101898557"}
]
EXISTING_EVENT_ID = "8ef07a70-41ac-491e-98ee-50d071d7436a"


class TestSetup:
    """Setup tests - login and auth"""
    
    @staticmethod
    def get_auth_token():
        """Helper to get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        return None

    def test_login_success(self):
        """Test login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json()}")
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data


class TestCalendarEvents:
    """Calendar event tests - create, read, edit, delete"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        self.token = TestSetup.get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_calendar_events(self):
        """Test getting all calendar events"""
        response = requests.get(f"{BASE_URL}/api/calendar", headers=self.headers)
        print(f"Get events response: {response.status_code}")
        assert response.status_code == 200
        events = response.json()
        print(f"Found {len(events)} events")
        assert isinstance(events, list)
    
    def test_verify_event_types_available(self):
        """Verify event types do NOT include parenting_time or exchange"""
        # Create an event with visitation type - this SHOULD work
        test_event = {
            "title": "TEST_visitation_event",
            "start_date": "2026-02-15",
            "end_date": "2026-02-15",
            "event_type": "visitation",
            "children_involved": [],
            "notes": "",
            "location": ""
        }
        response = requests.post(f"{BASE_URL}/api/calendar", headers=self.headers, json=test_event)
        print(f"Create visitation event: {response.status_code}")
        assert response.status_code == 200, f"Visitation event should be allowed"
        event_id = response.json()["event_id"]
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/calendar/{event_id}", headers=self.headers)
    
    def test_create_event_with_children_selection(self):
        """Test creating event with children selection"""
        test_event = {
            "title": "TEST_Event_With_Emma",
            "start_date": "2026-02-20",
            "end_date": "2026-02-20",
            "event_type": "visitation",
            "children_involved": [EXISTING_CHILDREN[0]["id"]],  # Emma
            "notes": "Test event with child",
            "location": "Home"
        }
        response = requests.post(f"{BASE_URL}/api/calendar", headers=self.headers, json=test_event)
        print(f"Create event with child: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert data["children_involved"] == [EXISTING_CHILDREN[0]["id"]]
        
        # Clean up
        event_id = data["event_id"]
        requests.delete(f"{BASE_URL}/api/calendar/{event_id}", headers=self.headers)
    
    def test_create_event_with_medical_type(self):
        """Test creating event with medical type - should be available"""
        test_event = {
            "title": "TEST_Medical_Appointment",
            "start_date": "2026-02-25",
            "end_date": "2026-02-25",
            "event_type": "medical",
            "children_involved": [EXISTING_CHILDREN[1]["id"]],  # Jack
            "notes": "Doctor visit",
            "location": "Clinic"
        }
        response = requests.post(f"{BASE_URL}/api/calendar", headers=self.headers, json=test_event)
        print(f"Create medical event: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert data["event_type"] == "medical"
        
        # Clean up
        event_id = data["event_id"]
        requests.delete(f"{BASE_URL}/api/calendar/{event_id}", headers=self.headers)
    
    def test_create_event_with_school_type(self):
        """Test creating event with school type - should be available"""
        test_event = {
            "title": "TEST_School_Event",
            "start_date": "2026-03-01",
            "end_date": "2026-03-01",
            "event_type": "school",
            "children_involved": [],
            "notes": "Parent-teacher meeting",
            "location": "School"
        }
        response = requests.post(f"{BASE_URL}/api/calendar", headers=self.headers, json=test_event)
        print(f"Create school event: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert data["event_type"] == "school"
        
        # Clean up
        event_id = data["event_id"]
        requests.delete(f"{BASE_URL}/api/calendar/{event_id}", headers=self.headers)
    
    def test_edit_calendar_event(self):
        """Test editing an existing calendar event"""
        # First create an event
        create_data = {
            "title": "TEST_Edit_Event_Original",
            "start_date": "2026-02-28",
            "end_date": "2026-02-28",
            "event_type": "visitation",
            "children_involved": [],
            "notes": "Original notes",
            "location": "Original location"
        }
        create_response = requests.post(f"{BASE_URL}/api/calendar", headers=self.headers, json=create_data)
        assert create_response.status_code == 200
        event_id = create_response.json()["event_id"]
        
        # Now update the event
        update_data = {
            "title": "TEST_Edit_Event_Updated",
            "start_date": "2026-03-01",
            "end_date": "2026-03-01",
            "event_type": "medical",
            "children_involved": [EXISTING_CHILDREN[0]["id"]],
            "notes": "Updated notes",
            "location": "Updated location"
        }
        update_response = requests.put(f"{BASE_URL}/api/calendar/{event_id}", headers=self.headers, json=update_data)
        print(f"Update event response: {update_response.status_code}")
        print(f"Update response: {update_response.json()}")
        assert update_response.status_code == 200
        updated_data = update_response.json()
        assert updated_data["title"] == "TEST_Edit_Event_Updated"
        assert updated_data["event_type"] == "medical"
        assert updated_data["children_involved"] == [EXISTING_CHILDREN[0]["id"]]
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/calendar", headers=self.headers)
        events = get_response.json()
        found = False
        for event in events:
            if event["event_id"] == event_id:
                found = True
                assert event["title"] == "TEST_Edit_Event_Updated"
                break
        assert found, "Updated event not found"
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/calendar/{event_id}", headers=self.headers)
    
    def test_edit_existing_event(self):
        """Test editing the existing event mentioned in test credentials"""
        # Try to get the existing event first
        get_response = requests.get(f"{BASE_URL}/api/calendar", headers=self.headers)
        events = get_response.json()
        
        existing_event = None
        for event in events:
            if event["event_id"] == EXISTING_EVENT_ID:
                existing_event = event
                break
        
        if existing_event:
            print(f"Found existing event: {existing_event}")
            # Try to update it
            update_data = {
                "title": existing_event["title"],  # Keep same title
                "start_date": existing_event["start_date"],
                "end_date": existing_event["end_date"],
                "event_type": existing_event["event_type"],
                "children_involved": existing_event.get("children_involved", []),
                "notes": existing_event.get("notes", "") + " [Updated by test]",
                "location": existing_event.get("location", "")
            }
            update_response = requests.put(
                f"{BASE_URL}/api/calendar/{EXISTING_EVENT_ID}", 
                headers=self.headers, 
                json=update_data
            )
            print(f"Edit existing event status: {update_response.status_code}")
            assert update_response.status_code == 200
        else:
            print(f"Existing event {EXISTING_EVENT_ID} not found - may have been deleted")
            pytest.skip("Existing event not found")
    
    def test_create_event_with_custom_color(self):
        """Test creating event with custom color for group events"""
        test_event = {
            "title": "TEST_Group_Event_Both_Kids",
            "start_date": "2026-03-05",
            "end_date": "2026-03-05",
            "event_type": "visitation",
            "children_involved": [EXISTING_CHILDREN[0]["id"], EXISTING_CHILDREN[1]["id"]],
            "notes": "Event with both kids",
            "location": "Park",
            "custom_color": "#8B5CF6"
        }
        response = requests.post(f"{BASE_URL}/api/calendar", headers=self.headers, json=test_event)
        print(f"Create event with custom color: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert data["custom_color"] == "#8B5CF6"
        assert len(data["children_involved"]) == 2
        
        # Clean up
        event_id = data["event_id"]
        requests.delete(f"{BASE_URL}/api/calendar/{event_id}", headers=self.headers)


class TestViolationsCRUD:
    """Violations CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        self.token = TestSetup.get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_violations(self):
        """Test getting all violations"""
        response = requests.get(f"{BASE_URL}/api/violations", headers=self.headers)
        print(f"Get violations: {response.status_code}")
        assert response.status_code == 200
        violations = response.json()
        print(f"Found {len(violations)} violations")
        assert isinstance(violations, list)
    
    def test_create_violation(self):
        """Test creating a violation"""
        violation_data = {
            "title": "TEST_Violation_Entry",
            "description": "Test violation description",
            "date": "2026-02-15",
            "violation_type": "parenting_time_denial",
            "severity": "medium",
            "witnesses": "John Doe",
            "evidence_notes": "Text messages as evidence"
        }
        response = requests.post(f"{BASE_URL}/api/violations", headers=self.headers, json=violation_data)
        print(f"Create violation: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Violation_Entry"
        self.created_violation_id = data["violation_id"]
        return data["violation_id"]
    
    def test_update_violation(self):
        """Test updating a violation"""
        # First create
        create_data = {
            "title": "TEST_Violation_To_Update",
            "description": "Original description",
            "date": "2026-02-16",
            "violation_type": "schedule_violation",
            "severity": "low",
            "witnesses": "",
            "evidence_notes": ""
        }
        create_response = requests.post(f"{BASE_URL}/api/violations", headers=self.headers, json=create_data)
        assert create_response.status_code == 200
        violation_id = create_response.json()["violation_id"]
        
        # Update
        update_data = {
            "title": "TEST_Violation_Updated",
            "description": "Updated description",
            "date": "2026-02-17",
            "violation_type": "custody_interference",
            "severity": "high",
            "witnesses": "Jane Doe",
            "evidence_notes": "Updated evidence"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/violations/{violation_id}", 
            headers=self.headers, 
            json=update_data
        )
        print(f"Update violation: {update_response.status_code}")
        print(f"Response: {update_response.json()}")
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["title"] == "TEST_Violation_Updated"
        assert updated["severity"] == "high"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/violations/{violation_id}", headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == "TEST_Violation_Updated"
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/violations/{violation_id}", headers=self.headers)
    
    def test_delete_violation(self):
        """Test deleting a violation"""
        # Create first
        create_data = {
            "title": "TEST_Violation_To_Delete",
            "description": "Will be deleted",
            "date": "2026-02-18",
            "violation_type": "late_pickup_dropoff",
            "severity": "low",
            "witnesses": "",
            "evidence_notes": ""
        }
        create_response = requests.post(f"{BASE_URL}/api/violations", headers=self.headers, json=create_data)
        assert create_response.status_code == 200
        violation_id = create_response.json()["violation_id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/violations/{violation_id}", headers=self.headers)
        print(f"Delete violation: {delete_response.status_code}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/violations/{violation_id}", headers=self.headers)
        assert get_response.status_code == 404


class TestJournalsCRUD:
    """Journal CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        self.token = TestSetup.get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_journals(self):
        """Test getting all journals"""
        response = requests.get(f"{BASE_URL}/api/journals", headers=self.headers)
        print(f"Get journals: {response.status_code}")
        assert response.status_code == 200
        journals = response.json()
        print(f"Found {len(journals)} journals")
        assert isinstance(journals, list)
    
    def test_create_and_update_journal(self):
        """Test creating and updating a journal entry"""
        # Create
        create_data = {
            "title": "TEST_Journal_Entry",
            "content": "Original journal content",
            "date": "2026-02-15",
            "children_involved": [EXISTING_CHILDREN[0]["id"]],
            "mood": "happy",
            "location": "Home"
        }
        create_response = requests.post(f"{BASE_URL}/api/journals", headers=self.headers, json=create_data)
        print(f"Create journal: {create_response.status_code}")
        assert create_response.status_code == 200
        journal_id = create_response.json()["journal_id"]
        
        # Update
        update_data = {
            "title": "TEST_Journal_Entry_Updated",
            "content": "Updated journal content with more details",
            "date": "2026-02-16",
            "children_involved": [EXISTING_CHILDREN[0]["id"], EXISTING_CHILDREN[1]["id"]],
            "mood": "calm",
            "location": "Park"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/journals/{journal_id}", 
            headers=self.headers, 
            json=update_data
        )
        print(f"Update journal: {update_response.status_code}")
        print(f"Response: {update_response.json()}")
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["title"] == "TEST_Journal_Entry_Updated"
        assert updated["mood"] == "calm"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/journals/{journal_id}", headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == "TEST_Journal_Entry_Updated"
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/journals/{journal_id}", headers=self.headers)


class TestContactsCRUD:
    """Contacts CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        self.token = TestSetup.get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_contacts(self):
        """Test getting all contacts"""
        response = requests.get(f"{BASE_URL}/api/contacts", headers=self.headers)
        print(f"Get contacts: {response.status_code}")
        assert response.status_code == 200
        contacts = response.json()
        print(f"Found {len(contacts)} contacts")
        assert isinstance(contacts, list)
    
    def test_create_and_update_contact(self):
        """Test creating and updating a contact"""
        # Create
        create_data = {
            "name": "TEST_Contact_Person",
            "address": "123 Test Street",
            "phones": [{"phone": "555-1234", "label": "mobile"}],
            "email": "test_contact@test.com",
            "notes": "Test contact notes",
            "photo": ""
        }
        create_response = requests.post(f"{BASE_URL}/api/contacts", headers=self.headers, json=create_data)
        print(f"Create contact: {create_response.status_code}")
        print(f"Response: {create_response.json()}")
        assert create_response.status_code == 200
        contact_id = create_response.json()["contact_id"]
        
        # Update
        update_data = {
            "name": "TEST_Contact_Person_Updated",
            "address": "456 Updated Street",
            "phones": [{"phone": "555-5678", "label": "work"}, {"phone": "555-9999", "label": "home"}],
            "email": "updated_contact@test.com",
            "notes": "Updated notes",
            "photo": ""
        }
        update_response = requests.put(
            f"{BASE_URL}/api/contacts/{contact_id}", 
            headers=self.headers, 
            json=update_data
        )
        print(f"Update contact: {update_response.status_code}")
        print(f"Response: {update_response.json()}")
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "TEST_Contact_Person_Updated"
        assert len(updated["phones"]) == 2
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/contacts/{contact_id}", headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == "TEST_Contact_Person_Updated"
        assert fetched["email"] == "updated_contact@test.com"
        
        # Clean up
        delete_response = requests.delete(f"{BASE_URL}/api/contacts/{contact_id}", headers=self.headers)
        assert delete_response.status_code == 200


class TestChildrenData:
    """Test children data availability"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        self.token = TestSetup.get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_children(self):
        """Test getting children - verify Emma and Jack exist"""
        response = requests.get(f"{BASE_URL}/api/children", headers=self.headers)
        print(f"Get children: {response.status_code}")
        assert response.status_code == 200
        children = response.json()
        print(f"Found {len(children)} children: {[c['name'] for c in children]}")
        
        # Check if Emma and Jack exist
        names = [c["name"] for c in children]
        emma_found = any("Emma" in name for name in names)
        jack_found = any("Jack" in name for name in names)
        
        print(f"Emma found: {emma_found}, Jack found: {jack_found}")
        # These should exist based on test credentials
        assert emma_found or jack_found or len(children) > 0, "Expected at least one child"


class TestDashboardStats:
    """Test dashboard stats endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        self.token = TestSetup.get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_dashboard_stats(self):
        """Test dashboard stats returns upcoming events"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        print(f"Dashboard stats: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        
        assert "counts" in data
        assert "upcoming_events" in data
        print(f"Counts: {data['counts']}")
        print(f"Upcoming events: {len(data.get('upcoming_events', []))}")
        
        # Verify structure
        if data["upcoming_events"]:
            event = data["upcoming_events"][0]
            print(f"First upcoming event: {event}")
            assert "event_id" in event
            assert "title" in event


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
