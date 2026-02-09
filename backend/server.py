from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'family-court-app-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Family Court Record Keeper")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    state: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    state: str
    photo: Optional[str] = ""
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Child Models
class ChildCreate(BaseModel):
    name: str
    date_of_birth: str
    notes: Optional[str] = ""
    color: Optional[str] = "#3B82F6"
    photo: Optional[str] = ""

class ChildResponse(BaseModel):
    child_id: str
    user_id: str
    name: str
    date_of_birth: str
    notes: str
    color: str
    photo: str
    created_at: str

# Contact Models
class PhoneNumber(BaseModel):
    phone: str
    label: Optional[str] = "mobile"

class ContactCreate(BaseModel):
    name: str
    address: Optional[str] = ""
    phones: List[PhoneNumber] = []
    email: Optional[str] = ""
    notes: Optional[str] = ""
    photo: Optional[str] = ""

class ContactResponse(BaseModel):
    contact_id: str
    user_id: str
    name: str
    address: str
    phones: List[PhoneNumber]
    email: str
    notes: str
    photo: str
    created_at: str
    updated_at: str

# Journal Models
class JournalCreate(BaseModel):
    title: str
    content: str
    date: str
    children_involved: List[str] = []
    mood: Optional[str] = "neutral"
    location: Optional[str] = ""
    photos: List[str] = []  # Base64 encoded photos

class JournalResponse(BaseModel):
    journal_id: str
    user_id: str
    title: str
    content: str
    date: str
    children_involved: List[str]
    mood: str
    location: str
    photos: List[str]
    created_at: str
    updated_at: str

# Violation Models
class ViolationCreate(BaseModel):
    title: str
    description: str
    date: str
    violation_type: str
    severity: str = "medium"
    witnesses: Optional[str] = ""
    evidence_notes: Optional[str] = ""

class ViolationResponse(BaseModel):
    violation_id: str
    user_id: str
    title: str
    description: str
    date: str
    violation_type: str
    severity: str
    witnesses: str
    evidence_notes: str
    created_at: str

# Document Models
class DocumentResponse(BaseModel):
    document_id: str
    user_id: str
    filename: str
    file_type: str
    file_size: int
    category: str
    description: str
    created_at: str

# Calendar Event Models
class CalendarEventCreate(BaseModel):
    title: str
    start_date: str
    end_date: str
    event_type: str
    children_involved: List[str] = []
    notes: Optional[str] = ""
    location: Optional[str] = ""
    recurring: Optional[bool] = False
    recurrence_pattern: Optional[str] = ""  # daily, weekly, biweekly, monthly, custom
    recurrence_end_date: Optional[str] = ""
    custom_color: Optional[str] = ""
    # For recurring event exceptions
    exception_dates: Optional[List[str]] = []  # Dates to skip in recurrence
    parent_event_id: Optional[str] = ""  # If this is an exception instance

class CalendarEventResponse(BaseModel):
    event_id: str
    user_id: str
    title: str
    start_date: str
    end_date: str
    event_type: str
    children_involved: List[str]
    notes: str
    location: str
    recurring: bool
    recurrence_pattern: str
    recurrence_end_date: str
    custom_color: str
    created_at: str
    exception_dates: List[str] = []
    parent_event_id: str = ""

# Share Token Models
class ShareTokenCreate(BaseModel):
    name: str  # Attorney name or description
    expires_days: int = 30  # Token expires after N days
    include_journals: bool = True
    include_violations: bool = True
    include_documents: bool = True
    include_calendar: bool = True

class ShareTokenResponse(BaseModel):
    token_id: str
    user_id: str
    name: str
    share_token: str
    expires_at: str
    include_journals: bool
    include_violations: bool
    include_documents: bool
    include_calendar: bool
    created_at: str
    is_active: bool

# Email Models
class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    content_type: str
    content_ids: List[str] = []

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "state": user_data.state,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            state=user_data.state,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["user_id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            full_name=user["full_name"],
            state=user["state"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    photo = current_user.get("photo", "")
    return UserResponse(
        user_id=current_user["user_id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        state=current_user["state"],
        photo=photo,
        created_at=current_user["created_at"]
    )

@api_router.put("/auth/profile")
async def update_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    if "full_name" in profile_data and profile_data["full_name"] is not None:
        update_data["full_name"] = profile_data["full_name"]
    if "photo" in profile_data and profile_data["photo"] is not None:
        update_data["photo"] = profile_data["photo"]
    
    if update_data:
        await db.users.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await db.users.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    return {"message": "Profile updated successfully", "user": updated_user}

# ============== CHILDREN ROUTES ==============

@api_router.post("/children", response_model=ChildResponse)
async def create_child(child_data: ChildCreate, current_user: dict = Depends(get_current_user)):
    child_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    child_doc = {
        "child_id": child_id,
        "user_id": current_user["user_id"],
        "name": child_data.name,
        "date_of_birth": child_data.date_of_birth,
        "notes": child_data.notes or "",
        "color": child_data.color or "#3B82F6",
        "photo": child_data.photo or "",
        "created_at": now
    }
    
    await db.children.insert_one(child_doc)
    
    return ChildResponse(**child_doc)

@api_router.get("/children", response_model=List[ChildResponse])
async def get_children(current_user: dict = Depends(get_current_user)):
    children = await db.children.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0}
    ).to_list(100)
    # Add default values if not present
    for child in children:
        if "color" not in child:
            child["color"] = "#3B82F6"
        if "photo" not in child:
            child["photo"] = ""
    return [ChildResponse(**child) for child in children]

@api_router.put("/children/{child_id}", response_model=ChildResponse)
async def update_child(child_id: str, child_data: ChildCreate, current_user: dict = Depends(get_current_user)):
    # Find existing child
    existing_child = await db.children.find_one({
        "child_id": child_id,
        "user_id": current_user["user_id"]
    }, {"_id": 0})
    
    if not existing_child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Update fields
    update_data = {
        "name": child_data.name,
        "date_of_birth": child_data.date_of_birth,
        "notes": child_data.notes or "",
        "color": child_data.color or "#3B82F6",
        "photo": child_data.photo or ""
    }
    
    await db.children.update_one(
        {"child_id": child_id, "user_id": current_user["user_id"]},
        {"$set": update_data}
    )
    
    existing_child.update(update_data)
    return ChildResponse(**existing_child)

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.children.delete_one({
        "child_id": child_id, 
        "user_id": current_user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"message": "Child deleted successfully"}

# ============== CONTACT ROUTES ==============

@api_router.post("/contacts", response_model=ContactResponse)
async def create_contact(contact_data: ContactCreate, current_user: dict = Depends(get_current_user)):
    contact_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    contact_doc = {
        "contact_id": contact_id,
        "user_id": current_user["user_id"],
        "name": contact_data.name,
        "address": contact_data.address or "",
        "phones": [phone.dict() for phone in contact_data.phones],
        "email": contact_data.email or "",
        "notes": contact_data.notes or "",
        "photo": contact_data.photo or "",
        "created_at": now,
        "updated_at": now
    }
    
    await db.contacts.insert_one(contact_doc)
    
    return ContactResponse(**contact_doc)

@api_router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(current_user: dict = Depends(get_current_user)):
    contacts = await db.contacts.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0}
    ).to_list(1000)
    # Add default values if not present
    for contact in contacts:
        if "photo" not in contact:
            contact["photo"] = ""
        if "phones" not in contact:
            contact["phones"] = []
    return [ContactResponse(**contact) for contact in contacts]

@api_router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    contact = await db.contacts.find_one({
        "contact_id": contact_id,
        "user_id": current_user["user_id"]
    }, {"_id": 0})
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    if "photo" not in contact:
        contact["photo"] = ""
    if "phones" not in contact:
        contact["phones"] = []
    
    return ContactResponse(**contact)

@api_router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(contact_id: str, contact_data: ContactCreate, current_user: dict = Depends(get_current_user)):
    existing_contact = await db.contacts.find_one({
        "contact_id": contact_id,
        "user_id": current_user["user_id"]
    }, {"_id": 0})
    
    if not existing_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "name": contact_data.name,
        "address": contact_data.address or "",
        "phones": [phone.dict() for phone in contact_data.phones],
        "email": contact_data.email or "",
        "notes": contact_data.notes or "",
        "photo": contact_data.photo or "",
        "updated_at": now
    }
    
    await db.contacts.update_one(
        {"contact_id": contact_id, "user_id": current_user["user_id"]},
        {"$set": update_data}
    )
    
    existing_contact.update(update_data)
    return ContactResponse(**existing_contact)

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.contacts.delete_one({
        "contact_id": contact_id, 
        "user_id": current_user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}

# ============== JOURNAL ROUTES ==============

@api_router.post("/journals", response_model=JournalResponse)
async def create_journal(journal_data: JournalCreate, current_user: dict = Depends(get_current_user)):
    journal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    journal_doc = {
        "journal_id": journal_id,
        "user_id": current_user["user_id"],
        "title": journal_data.title,
        "content": journal_data.content,
        "date": journal_data.date,
        "children_involved": journal_data.children_involved,
        "mood": journal_data.mood or "neutral",
        "location": journal_data.location or "",
        "photos": journal_data.photos or [],
        "created_at": now,
        "updated_at": now
    }
    
    await db.journals.insert_one(journal_doc)
    
    return JournalResponse(**journal_doc)

@api_router.get("/journals", response_model=List[JournalResponse])
async def get_journals(current_user: dict = Depends(get_current_user)):
    journals = await db.journals.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    # Add default values for photos if not present
    for journal in journals:
        if "photos" not in journal:
            journal["photos"] = []
    return [JournalResponse(**journal) for journal in journals]

@api_router.get("/journals/{journal_id}", response_model=JournalResponse)
async def get_journal(journal_id: str, current_user: dict = Depends(get_current_user)):
    journal = await db.journals.find_one(
        {"journal_id": journal_id, "user_id": current_user["user_id"]}, 
        {"_id": 0}
    )
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    if "photos" not in journal:
        journal["photos"] = []
    return JournalResponse(**journal)

@api_router.put("/journals/{journal_id}", response_model=JournalResponse)
async def update_journal(journal_id: str, journal_data: JournalCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    
    update_doc = {
        "title": journal_data.title,
        "content": journal_data.content,
        "date": journal_data.date,
        "children_involved": journal_data.children_involved,
        "mood": journal_data.mood or "neutral",
        "location": journal_data.location or "",
        "photos": journal_data.photos or [],
        "updated_at": now
    }
    
    result = await db.journals.update_one(
        {"journal_id": journal_id, "user_id": current_user["user_id"]},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Journal not found")
    
    journal = await db.journals.find_one(
        {"journal_id": journal_id}, 
        {"_id": 0}
    )
    if "photos" not in journal:
        journal["photos"] = []
    return JournalResponse(**journal)

@api_router.delete("/journals/{journal_id}")
async def delete_journal(journal_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.journals.delete_one({
        "journal_id": journal_id, 
        "user_id": current_user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Journal not found")
    return {"message": "Journal deleted successfully"}

# ============== VIOLATIONS ROUTES ==============

@api_router.post("/violations", response_model=ViolationResponse)
async def create_violation(violation_data: ViolationCreate, current_user: dict = Depends(get_current_user)):
    violation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    violation_doc = {
        "violation_id": violation_id,
        "user_id": current_user["user_id"],
        "title": violation_data.title,
        "description": violation_data.description,
        "date": violation_data.date,
        "violation_type": violation_data.violation_type,
        "severity": violation_data.severity,
        "witnesses": violation_data.witnesses or "",
        "evidence_notes": violation_data.evidence_notes or "",
        "created_at": now
    }
    
    await db.violations.insert_one(violation_doc)
    
    return ViolationResponse(**violation_doc)

@api_router.get("/violations", response_model=List[ViolationResponse])
async def get_violations(current_user: dict = Depends(get_current_user)):
    violations = await db.violations.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    return [ViolationResponse(**violation) for violation in violations]

@api_router.get("/violations/{violation_id}", response_model=ViolationResponse)
async def get_violation(violation_id: str, current_user: dict = Depends(get_current_user)):
    violation = await db.violations.find_one(
        {"violation_id": violation_id, "user_id": current_user["user_id"]}, 
        {"_id": 0}
    )
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    return ViolationResponse(**violation)

@api_router.put("/violations/{violation_id}", response_model=ViolationResponse)
async def update_violation(violation_id: str, violation_data: ViolationCreate, current_user: dict = Depends(get_current_user)):
    # Check if violation exists
    existing_violation = await db.violations.find_one({
        "violation_id": violation_id,
        "user_id": current_user["user_id"]
    }, {"_id": 0})
    
    if not existing_violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    # Update fields
    update_data = {
        "title": violation_data.title,
        "violation_type": violation_data.violation_type,
        "description": violation_data.description,
        "date": violation_data.date,
        "severity": violation_data.severity,
        "witnesses": violation_data.witnesses or "",
        "evidence_notes": violation_data.evidence_notes or "",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.violations.update_one(
        {"violation_id": violation_id, "user_id": current_user["user_id"]},
        {"$set": update_data}
    )
    
    existing_violation.update(update_data)
    return ViolationResponse(**existing_violation)

@api_router.delete("/violations/{violation_id}")
async def delete_violation(violation_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.violations.delete_one({
        "violation_id": violation_id, 
        "user_id": current_user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Violation not found")
    return {"message": "Violation deleted successfully"}

# ============== DOCUMENTS ROUTES ==============

@api_router.post("/documents", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(...),
    description: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    allowed_types = [
        # Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        # Images
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
        # Videos
        "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", 
        "video/webm", "video/x-ms-wmv", "video/3gpp",
        # Audio
        "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac",
        "audio/x-m4a", "audio/mp4", "audio/webm"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed. Supported: PDF, Images, Word docs, Videos, Audio")
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Max file size: 50MB for videos/audio, 10MB for others
    max_size = 50 * 1024 * 1024 if file.content_type.startswith(("video/", "audio/")) else 10 * 1024 * 1024
    max_size_mb = 50 if file.content_type.startswith(("video/", "audio/")) else 10
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"File too large (max {max_size_mb}MB)")
    
    document_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Store file as base64
    file_base64 = base64.b64encode(file_content).decode('utf-8')
    
    document_doc = {
        "document_id": document_id,
        "user_id": current_user["user_id"],
        "filename": file.filename,
        "file_type": file.content_type,
        "file_size": file_size,
        "file_data": file_base64,
        "category": category,
        "description": description,
        "created_at": now
    }
    
    await db.documents.insert_one(document_doc)
    
    return DocumentResponse(
        document_id=document_id,
        user_id=current_user["user_id"],
        filename=file.filename,
        file_type=file.content_type,
        file_size=file_size,
        category=category,
        description=description,
        created_at=now
    )

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(current_user: dict = Depends(get_current_user)):
    documents = await db.documents.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0, "file_data": 0}
    ).sort("created_at", -1).to_list(1000)
    return [DocumentResponse(**doc) for doc in documents]

@api_router.get("/documents/{document_id}/download")
async def download_document(document_id: str, current_user: dict = Depends(get_current_user)):
    document = await db.documents.find_one(
        {"document_id": document_id, "user_id": current_user["user_id"]}, 
        {"_id": 0}
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "filename": document["filename"],
        "file_type": document["file_type"],
        "file_data": document["file_data"]
    }

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.documents.delete_one({
        "document_id": document_id, 
        "user_id": current_user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}

# ============== CALENDAR ROUTES ==============

@api_router.post("/calendar", response_model=CalendarEventResponse)
async def create_calendar_event(event_data: CalendarEventCreate, current_user: dict = Depends(get_current_user)):
    event_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    event_doc = {
        "event_id": event_id,
        "user_id": current_user["user_id"],
        "title": event_data.title,
        "start_date": event_data.start_date,
        "end_date": event_data.end_date,
        "event_type": event_data.event_type,
        "children_involved": event_data.children_involved,
        "notes": event_data.notes or "",
        "location": event_data.location or "",
        "recurring": event_data.recurring or False,
        "recurrence_pattern": event_data.recurrence_pattern or "",
        "recurrence_end_date": event_data.recurrence_end_date or "",
        "custom_color": event_data.custom_color or "",
        "exception_dates": event_data.exception_dates or [],
        "parent_event_id": event_data.parent_event_id or "",
        "created_at": now
    }
    
    # If creating single instance exception, add date to parent's exception_dates
    if event_data.parent_event_id:
        await db.calendar_events.update_one(
            {"event_id": event_data.parent_event_id, "user_id": current_user["user_id"]},
            {"$addToSet": {"exception_dates": event_data.start_date}}
        )
    
    await db.calendar_events.insert_one(event_doc)
    
    return CalendarEventResponse(**event_doc)

@api_router.get("/calendar", response_model=List[CalendarEventResponse])
async def get_calendar_events(current_user: dict = Depends(get_current_user)):
    events = await db.calendar_events.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0}
    ).sort("start_date", 1).to_list(1000)
    # Add default values for missing fields
    for event in events:
        if "custom_color" not in event:
            event["custom_color"] = ""
        if "recurrence_pattern" not in event:
            event["recurrence_pattern"] = ""
        if "recurrence_end_date" not in event:
            event["recurrence_end_date"] = ""
        if "exception_dates" not in event:
            event["exception_dates"] = []
        if "parent_event_id" not in event:
            event["parent_event_id"] = ""
    return [CalendarEventResponse(**event) for event in events]

@api_router.put("/calendar/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(event_id: str, event_data: CalendarEventCreate, current_user: dict = Depends(get_current_user)):
    update_doc = {
        "title": event_data.title,
        "start_date": event_data.start_date,
        "end_date": event_data.end_date,
        "event_type": event_data.event_type,
        "children_involved": event_data.children_involved,
        "notes": event_data.notes or "",
        "location": event_data.location or "",
        "recurring": event_data.recurring or False,
        "recurrence_pattern": event_data.recurrence_pattern or "",
        "recurrence_end_date": event_data.recurrence_end_date or "",
        "custom_color": event_data.custom_color or ""
    }
    
    # Don't overwrite exception_dates on normal update
    
    result = await db.calendar_events.update_one(
        {"event_id": event_id, "user_id": current_user["user_id"]},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = await db.calendar_events.find_one(
        {"event_id": event_id}, 
        {"_id": 0}
    )
    if "custom_color" not in event:
        event["custom_color"] = ""
    if "recurrence_pattern" not in event:
        event["recurrence_pattern"] = ""
    if "recurrence_end_date" not in event:
        event["recurrence_end_date"] = ""
    if "exception_dates" not in event:
        event["exception_dates"] = []
    if "parent_event_id" not in event:
        event["parent_event_id"] = ""
    return CalendarEventResponse(**event)

@api_router.delete("/calendar/{event_id}")
async def delete_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.calendar_events.delete_one({
        "event_id": event_id, 
        "user_id": current_user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# ============== STATE LAWS ROUTES ==============

# Direct links to official state government family law statutes
STATE_FAMILY_LAW_LINKS = {
    "Alabama": {
        "statutes": "https://alisondb.legislature.state.al.us/alison/CodeOfAlabama/1975/Coatoc.htm",
        "name": "Code of Alabama - Title 30: Marital and Domestic Relations"
    },
    "Alaska": {
        "statutes": "https://www.akleg.gov/basis/statutes.asp#25",
        "name": "Alaska Statutes - Title 25: Marital and Domestic Relations"
    },
    "Arizona": {
        "statutes": "https://www.azleg.gov/arsDetail/?title=25",
        "name": "Arizona Revised Statutes - Title 25: Marital and Domestic Relations"
    },
    "Arkansas": {
        "statutes": "https://www.lexisnexis.com/hottopics/arcode/Default.asp",
        "name": "Arkansas Code - Title 9: Family Law"
    },
    "California": {
        "statutes": "https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=FAM",
        "name": "California Family Code"
    },
    "Colorado": {
        "statutes": "https://leg.colorado.gov/colorado-revised-statutes",
        "name": "Colorado Revised Statutes - Title 14: Domestic Matters"
    },
    "Connecticut": {
        "statutes": "https://www.cga.ct.gov/current/pub/titles.htm",
        "name": "Connecticut General Statutes - Title 46b: Family Law"
    },
    "Delaware": {
        "statutes": "https://delcode.delaware.gov/title13/index.html",
        "name": "Delaware Code - Title 13: Domestic Relations"
    },
    "Florida": {
        "statutes": "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0000-0099/0061/0061ContentsIndex.html",
        "name": "Florida Statutes - Chapter 61: Dissolution of Marriage"
    },
    "Georgia": {
        "statutes": "https://law.justia.com/codes/georgia/title-19/",
        "name": "Official Code of Georgia - Title 19: Domestic Relations"
    },
    "Hawaii": {
        "statutes": "https://www.capitol.hawaii.gov/hrscurrent/Vol12_Ch0501-0588/",
        "name": "Hawaii Revised Statutes - Division 3: Property, Family"
    },
    "Idaho": {
        "statutes": "https://legislature.idaho.gov/statutesrules/idstat/Title32/",
        "name": "Idaho Statutes - Title 32: Domestic Relations"
    },
    "Illinois": {
        "statutes": "https://www.ilga.gov/legislation/ilcs/ilcs2.asp?ChapterID=59",
        "name": "Illinois Compiled Statutes - Chapter 750: Families"
    },
    "Indiana": {
        "statutes": "https://iga.in.gov/laws/2023/ic/titles/31",
        "name": "Indiana Code - Title 31: Family Law and Juvenile Law"
    },
    "Iowa": {
        "statutes": "https://www.legis.iowa.gov/law/iowaCode/sections?codeChapter=598",
        "name": "Iowa Code - Chapter 598: Dissolution of Marriage"
    },
    "Kansas": {
        "statutes": "https://www.ksrevisor.org/statutes/chapters/ch23/",
        "name": "Kansas Statutes - Chapter 23: Domestic Relations"
    },
    "Kentucky": {
        "statutes": "https://apps.legislature.ky.gov/law/statutes/chapter.aspx?id=39208",
        "name": "Kentucky Revised Statutes - Chapter 403: Dissolution of Marriage"
    },
    "Louisiana": {
        "statutes": "https://www.legis.la.gov/legis/Laws_Toc.aspx?folder=67",
        "name": "Louisiana Civil Code - Book I: Of Persons"
    },
    "Maine": {
        "statutes": "https://legislature.maine.gov/statutes/19-A/title19-Ach0.pdf",
        "name": "Maine Revised Statutes - Title 19-A: Domestic Relations"
    },
    "Maryland": {
        "statutes": "https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gfl",
        "name": "Maryland Code - Family Law Article"
    },
    "Massachusetts": {
        "statutes": "https://malegislature.gov/Laws/GeneralLaws/PartII/TitleIII/Chapter208",
        "name": "Massachusetts General Laws - Chapter 208: Divorce"
    },
    "Michigan": {
        "statutes": "https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-Act-259-of-1846",
        "name": "Michigan Compiled Laws - Chapter 552: Divorce"
    },
    "Minnesota": {
        "statutes": "https://www.revisor.mn.gov/statutes/cite/518",
        "name": "Minnesota Statutes - Chapter 518: Marriage Dissolution"
    },
    "Mississippi": {
        "statutes": "https://law.justia.com/codes/mississippi/title-93/",
        "name": "Mississippi Code - Title 93: Domestic Relations"
    },
    "Missouri": {
        "statutes": "https://revisor.mo.gov/main/OneChapter.aspx?chapter=452",
        "name": "Missouri Revised Statutes - Chapter 452: Dissolution of Marriage"
    },
    "Montana": {
        "statutes": "https://leg.mt.gov/bills/mca/title_0400/chapters_index.html",
        "name": "Montana Code - Title 40: Family Law"
    },
    "Nebraska": {
        "statutes": "https://nebraskalegislature.gov/laws/browse-chapters.php?chapter=42",
        "name": "Nebraska Revised Statutes - Chapter 42: Domestic Relations"
    },
    "Nevada": {
        "statutes": "https://www.leg.state.nv.us/nrs/NRS-125.html",
        "name": "Nevada Revised Statutes - Chapter 125: Dissolution of Marriage"
    },
    "New Hampshire": {
        "statutes": "https://www.gencourt.state.nh.us/rsa/html/XLIII/458/458-mrg.htm",
        "name": "New Hampshire Revised Statutes - Chapter 458: Divorce"
    },
    "New Jersey": {
        "statutes": "https://lis.njleg.state.nj.us/nxt/gateway.dll?f=templates&fn=default.htm&vid=Publish:10.1048/Enu",
        "name": "New Jersey Statutes - Title 9: Children and Domestic Relations"
    },
    "New Mexico": {
        "statutes": "https://nmonesource.com/nmos/nmsa/en/nav.do",
        "name": "New Mexico Statutes - Chapter 40: Domestic Affairs"
    },
    "New York": {
        "statutes": "https://www.nysenate.gov/legislation/laws/DOM",
        "name": "New York Domestic Relations Law"
    },
    "North Carolina": {
        "statutes": "https://www.ncleg.gov/Laws/GeneralStatutesTOC/Chapter/50",
        "name": "North Carolina General Statutes - Chapter 50: Divorce and Alimony"
    },
    "North Dakota": {
        "statutes": "https://www.ndlegis.gov/cencode/t14.html",
        "name": "North Dakota Century Code - Title 14: Domestic Relations"
    },
    "Ohio": {
        "statutes": "https://codes.ohio.gov/ohio-revised-code/title-31",
        "name": "Ohio Revised Code - Title 31: Domestic Relations"
    },
    "Oklahoma": {
        "statutes": "https://oksenate.gov/sites/default/files/2019-12/os43.pdf",
        "name": "Oklahoma Statutes - Title 43: Marriage and Family"
    },
    "Oregon": {
        "statutes": "https://www.oregonlegislature.gov/bills_laws/ors/ors107.html",
        "name": "Oregon Revised Statutes - Chapter 107: Dissolution of Marriage"
    },
    "Pennsylvania": {
        "statutes": "https://www.legis.state.pa.us/cfdocs/legis/LI/consCheck.cfm?txtType=HTM&ttl=23",
        "name": "Pennsylvania Consolidated Statutes - Title 23: Domestic Relations"
    },
    "Rhode Island": {
        "statutes": "http://webserver.rilin.state.ri.us/Statutes/TITLE15/INDEX.HTM",
        "name": "Rhode Island General Laws - Title 15: Domestic Relations"
    },
    "South Carolina": {
        "statutes": "https://www.scstatehouse.gov/code/title20.php",
        "name": "South Carolina Code - Title 20: Domestic Relations"
    },
    "South Dakota": {
        "statutes": "https://sdlegislature.gov/Statutes/Codified_Laws/2078844",
        "name": "South Dakota Codified Laws - Title 25: Domestic Relations"
    },
    "Tennessee": {
        "statutes": "https://www.capitol.tn.gov/Bills/Comp/Pub/TitleListing/TITLE0036.htm",
        "name": "Tennessee Code - Title 36: Domestic Relations"
    },
    "Texas": {
        "statutes": "https://statutes.capitol.texas.gov/Docs/FA/htm/FA.1.htm",
        "name": "Texas Family Code"
    },
    "Utah": {
        "statutes": "https://le.utah.gov/xcode/Title30/30.html",
        "name": "Utah Code - Title 30: Husband and Wife"
    },
    "Vermont": {
        "statutes": "https://legislature.vermont.gov/statutes/title/15",
        "name": "Vermont Statutes - Title 15: Domestic Relations"
    },
    "Virginia": {
        "statutes": "https://law.lis.virginia.gov/vacode/title20/",
        "name": "Code of Virginia - Title 20: Domestic Relations"
    },
    "Washington": {
        "statutes": "https://app.leg.wa.gov/rcw/default.aspx?cite=26",
        "name": "Revised Code of Washington - Title 26: Domestic Relations"
    },
    "West Virginia": {
        "statutes": "https://www.wvlegislature.gov/wvcode/code.cfm?chap=48&art=1",
        "name": "West Virginia Code - Chapter 48: Domestic Relations"
    },
    "Wisconsin": {
        "statutes": "https://docs.legis.wisconsin.gov/statutes/statutes/767",
        "name": "Wisconsin Statutes - Chapter 767: Actions Affecting the Family"
    },
    "Wyoming": {
        "statutes": "https://wyoleg.gov/NXT/gateway.dll?f=templates&fn=default.htm",
        "name": "Wyoming Statutes - Title 20: Domestic Relations"
    },
    "District of Columbia": {
        "statutes": "https://code.dccouncil.gov/us/dc/council/code/titles/16/chapters/9",
        "name": "DC Code - Title 16, Chapter 9: Divorce, Annulment, Separation"
    }
}

# Parental Alienation Resources and Advocacy Groups - Social Media Links
PARENTAL_ALIENATION_RESOURCES = [
    {
        "name": "The Dadvocate",
        "description": "Advocacy and support for fathers navigating custody and co-parenting challenges",
        "links": [
            {"platform": "TikTok", "url": "https://www.tiktok.com/@the_dadvocate"},
            {"platform": "Facebook", "url": "https://www.facebook.com/share/1AUyUK28xM/"},
            {"platform": "Website", "url": "https://dadvocate.net"}
        ]
    },
    {
        "name": "Robert Garza",
        "description": "Father's rights advocate sharing advice and support for dads in custody battles",
        "links": [
            {"platform": "Website", "url": "https://robertgarza.us"},
            {"platform": "Facebook", "url": "https://www.facebook.com/share/1732fKF1Lg/"}
        ]
    },
    {
        "name": "Mark Ludwig",
        "description": "Family law attorney providing education on custody and parental rights",
        "links": [
            {"platform": "Website", "url": "https://stlmarkludwig.com"},
            {"platform": "Facebook", "url": "https://www.facebook.com/share/17wXww23Gj/"}
        ]
    },
    {
        "name": "P.A.P.A (Parents Against Parental Alienation)",
        "description": "Support community for parents experiencing parental alienation",
        "links": [
            {"platform": "TikTok", "url": "https://www.tiktok.com/@papa.support"},
            {"platform": "Facebook", "url": "https://www.facebook.com/groups/167881353601718/?ref=share&mibextid=NSMWBT"}
        ]
    },
    {
        "name": "National Parents Organization",
        "description": "Advocates for shared parenting and family court reform nationwide",
        "links": [
            {"platform": "Facebook", "url": "https://www.facebook.com/share/187qQZBmFB/"}
        ]
    },
    {
        "name": "Father's Rights Movement",
        "description": "Community supporting fathers fighting for equal custody rights",
        "links": [
            {"platform": "TikTok", "url": "https://www.tiktok.com/@thefathersrightsmovement"},
            {"platform": "Facebook", "url": "https://www.facebook.com/share/1DpQmLqE2a/"}
        ]
    },
    {
        "name": "Moms for Shared Parenting",
        "description": "Mothers advocating for 50/50 shared parenting arrangements",
        "links": [
            {"platform": "Facebook", "url": "https://www.facebook.com/MomsForSharedParenting"}
        ]
    },
    {
        "name": "Parental Alienation Awareness",
        "description": "Raising awareness about parental alienation and its effects on children",
        "links": [
            {"platform": "Instagram", "url": "https://www.instagram.com/parentalalienationawareness"}
        ]
    },
    {
        "name": "The Children's Rights Movement",
        "description": "Non-profit focused on ensuring children have meaningful relationships with both parents",
        "links": [
            {"platform": "Website", "url": "https://projectcoparent.com"},
            {"platform": "Facebook", "url": "https://www.facebook.com/share/1CFtrz3ihh/"}
        ]
    },
    {
        "name": "Americans for Equal Shared Parenting",
        "description": "National organization advocating for equal shared parenting legislation and reform",
        "links": [
            {"platform": "Website", "url": "https://afesp.com"}
        ]
    }
]

@api_router.get("/state-laws")
async def get_state_laws():
    return {"states": STATE_FAMILY_LAW_LINKS}

@api_router.get("/state-laws/{state}")
async def get_state_law(state: str):
    if state not in STATE_FAMILY_LAW_LINKS:
        raise HTTPException(status_code=404, detail="State not found")
    return {"state": state, "data": STATE_FAMILY_LAW_LINKS[state]}

@api_router.get("/resources/parental-alienation")
async def get_parental_alienation_resources():
    return {"resources": PARENTAL_ALIENATION_RESOURCES}

# ============== EMAIL ROUTES ==============

@api_router.post("/send-email")
async def send_email(request: EmailRequest, current_user: dict = Depends(get_current_user)):
    try:
        import resend
        
        resend_api_key = os.environ.get('RESEND_API_KEY')
        if not resend_api_key:
            raise HTTPException(status_code=500, detail="Email service not configured")
        
        resend.api_key = resend_api_key
        sender_email = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
        
        # Build email content based on content_type
        html_content = "<h2>Family Court Records Export</h2>"
        html_content += f"<p>Sent by: {current_user['full_name']}</p>"
        html_content += "<hr>"
        
        if request.content_type == "journals":
            journals = await db.journals.find(
                {"journal_id": {"$in": request.content_ids}, "user_id": current_user["user_id"]},
                {"_id": 0}
            ).to_list(100)
            
            for journal in journals:
                html_content += f"<h3>{journal['title']}</h3>"
                html_content += f"<p><strong>Date:</strong> {journal['date']}</p>"
                html_content += f"<p>{journal['content']}</p>"
                html_content += "<hr>"
        
        elif request.content_type == "violations":
            violations = await db.violations.find(
                {"violation_id": {"$in": request.content_ids}, "user_id": current_user["user_id"]},
                {"_id": 0}
            ).to_list(100)
            
            for violation in violations:
                html_content += f"<h3>{violation['title']}</h3>"
                html_content += f"<p><strong>Date:</strong> {violation['date']}</p>"
                html_content += f"<p><strong>Type:</strong> {violation['violation_type']}</p>"
                html_content += f"<p><strong>Severity:</strong> {violation['severity']}</p>"
                html_content += f"<p>{violation['description']}</p>"
                html_content += "<hr>"
        
        params = {
            "from": sender_email,
            "to": [request.recipient_email],
            "subject": request.subject,
            "html": html_content
        }
        
        email = await asyncio.to_thread(resend.Emails.send, params)
        
        return {
            "status": "success",
            "message": f"Email sent to {request.recipient_email}",
            "email_id": email.get("id")
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="Email service not available")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# ============== DASHBOARD STATS ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    
    # Count all items
    children_count = await db.children.count_documents({"user_id": user_id})
    journals_count = await db.journals.count_documents({"user_id": user_id})
    violations_count = await db.violations.count_documents({"user_id": user_id})
    documents_count = await db.documents.count_documents({"user_id": user_id})
    events_count = await db.calendar_events.count_documents({"user_id": user_id})
    contacts_count = await db.contacts.count_documents({"user_id": user_id})
    
    # Get upcoming events
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    upcoming_events = await db.calendar_events.find(
        {"user_id": user_id, "start_date": {"$gte": today}},
        {"_id": 0}
    ).sort("start_date", 1).limit(5).to_list(5)
    
    # Get recent journals
    recent_journals = await db.journals.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get recent violations
    recent_violations = await db.violations.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "counts": {
            "children": children_count,
            "journals": journals_count,
            "violations": violations_count,
            "documents": documents_count,
            "events": events_count,
            "contacts": contacts_count
        },
        "upcoming_events": upcoming_events,
        "recent_journals": recent_journals,
        "recent_violations": recent_violations
    }

# ============== EXPORT ROUTES ==============

@api_router.get("/export/journals")
async def export_journals(current_user: dict = Depends(get_current_user)):
    journals = await db.journals.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    return {"journals": journals, "exported_at": datetime.now(timezone.utc).isoformat()}

@api_router.get("/export/violations")
async def export_violations(current_user: dict = Depends(get_current_user)):
    violations = await db.violations.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    return {"violations": violations, "exported_at": datetime.now(timezone.utc).isoformat()}

# ============== SHARING ROUTES ==============

@api_router.post("/share/tokens", response_model=ShareTokenResponse)
async def create_share_token(token_data: ShareTokenCreate, current_user: dict = Depends(get_current_user)):
    token_id = str(uuid.uuid4())
    share_token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(days=token_data.expires_days)).isoformat()
    
    token_doc = {
        "token_id": token_id,
        "user_id": current_user["user_id"],
        "name": token_data.name,
        "share_token": share_token,
        "expires_at": expires_at,
        "include_journals": token_data.include_journals,
        "include_violations": token_data.include_violations,
        "include_documents": token_data.include_documents,
        "include_calendar": token_data.include_calendar,
        "created_at": now.isoformat(),
        "is_active": True
    }
    
    await db.share_tokens.insert_one(token_doc)
    
    return ShareTokenResponse(**token_doc)

@api_router.get("/share/tokens", response_model=List[ShareTokenResponse])
async def get_share_tokens(current_user: dict = Depends(get_current_user)):
    tokens = await db.share_tokens.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [ShareTokenResponse(**token) for token in tokens]

@api_router.delete("/share/tokens/{token_id}")
async def revoke_share_token(token_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.share_tokens.update_one(
        {"token_id": token_id, "user_id": current_user["user_id"]},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Token not found")
    return {"message": "Share token revoked"}

# Public shared view (no auth required)
@api_router.get("/shared/{share_token}")
async def get_shared_data(share_token: str):
    token = await db.share_tokens.find_one(
        {"share_token": share_token, "is_active": True},
        {"_id": 0}
    )
    
    if not token:
        raise HTTPException(status_code=404, detail="Invalid or expired share link")
    
    # Check if token has expired
    expires_at = datetime.fromisoformat(token["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    user_id = token["user_id"]
    data = {"shared_by": token["name"], "expires_at": token["expires_at"]}
    
    # Get user's children for reference
    children = await db.children.find(
        {"user_id": user_id},
        {"_id": 0, "child_id": 1, "name": 1, "color": 1}
    ).to_list(100)
    data["children"] = children
    
    if token.get("include_journals"):
        journals = await db.journals.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("date", -1).to_list(500)
        for j in journals:
            if "photos" not in j:
                j["photos"] = []
        data["journals"] = journals
    
    if token.get("include_violations"):
        violations = await db.violations.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("date", -1).to_list(500)
        data["violations"] = violations
    
    if token.get("include_documents"):
        documents = await db.documents.find(
            {"user_id": user_id},
            {"_id": 0, "file_data": 0}  # Exclude binary data
        ).sort("uploaded_at", -1).to_list(500)
        data["documents"] = documents
    
    if token.get("include_calendar"):
        events = await db.calendar_events.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("start_date", 1).to_list(500)
        for e in events:
            if "custom_color" not in e:
                e["custom_color"] = ""
            if "recurrence_pattern" not in e:
                e["recurrence_pattern"] = ""
            if "recurrence_end_date" not in e:
                e["recurrence_end_date"] = ""
        data["events"] = events
    
    return data

# Include the router in the main app
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
