from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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

class ChildResponse(BaseModel):
    child_id: str
    user_id: str
    name: str
    date_of_birth: str
    notes: str
    created_at: str

# Journal Models
class JournalCreate(BaseModel):
    title: str
    content: str
    date: str
    children_involved: List[str] = []
    mood: Optional[str] = "neutral"
    location: Optional[str] = ""

class JournalResponse(BaseModel):
    journal_id: str
    user_id: str
    title: str
    content: str
    date: str
    children_involved: List[str]
    mood: str
    location: str
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
    created_at: str

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
    return UserResponse(
        user_id=current_user["user_id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        state=current_user["state"],
        created_at=current_user["created_at"]
    )

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
    return [ChildResponse(**child) for child in children]

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.children.delete_one({
        "child_id": child_id, 
        "user_id": current_user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"message": "Child deleted successfully"}

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
    return [JournalResponse(**journal) for journal in journals]

@api_router.get("/journals/{journal_id}", response_model=JournalResponse)
async def get_journal(journal_id: str, current_user: dict = Depends(get_current_user)):
    journal = await db.journals.find_one(
        {"journal_id": journal_id, "user_id": current_user["user_id"]}, 
        {"_id": 0}
    )
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
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
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Max file size: 10MB
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
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
        "created_at": now
    }
    
    await db.calendar_events.insert_one(event_doc)
    
    return CalendarEventResponse(**event_doc)

@api_router.get("/calendar", response_model=List[CalendarEventResponse])
async def get_calendar_events(current_user: dict = Depends(get_current_user)):
    events = await db.calendar_events.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0}
    ).sort("start_date", 1).to_list(1000)
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
        "recurring": event_data.recurring or False
    }
    
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

# Direct links to state family law statutes
STATE_FAMILY_LAW_LINKS = {
    "Alabama": {
        "statutes": "https://law.justia.com/codes/alabama/title-30/",
        "name": "Title 30 - Marital and Domestic Relations"
    },
    "Alaska": {
        "statutes": "https://law.justia.com/codes/alaska/title-25/",
        "name": "Title 25 - Marital and Domestic Relations"
    },
    "Arizona": {
        "statutes": "https://law.justia.com/codes/arizona/title-25/",
        "name": "Title 25 - Marital and Domestic Relations"
    },
    "Arkansas": {
        "statutes": "https://law.justia.com/codes/arkansas/title-9/",
        "name": "Title 9 - Family Law"
    },
    "California": {
        "statutes": "https://law.justia.com/codes/california/code-fam/",
        "name": "California Family Code"
    },
    "Colorado": {
        "statutes": "https://law.justia.com/codes/colorado/title-14/",
        "name": "Title 14 - Domestic Matters"
    },
    "Connecticut": {
        "statutes": "https://law.justia.com/codes/connecticut/title-46b/",
        "name": "Title 46b - Family Law"
    },
    "Delaware": {
        "statutes": "https://law.justia.com/codes/delaware/title-13/",
        "name": "Title 13 - Domestic Relations"
    },
    "Florida": {
        "statutes": "https://law.justia.com/codes/florida/title-vi/",
        "name": "Title VI - Civil Practice and Procedure (Chapter 61 - Dissolution of Marriage)"
    },
    "Georgia": {
        "statutes": "https://law.justia.com/codes/georgia/title-19/",
        "name": "Title 19 - Domestic Relations"
    },
    "Hawaii": {
        "statutes": "https://law.justia.com/codes/hawaii/division-3/",
        "name": "Division 3 - Property; Family"
    },
    "Idaho": {
        "statutes": "https://law.justia.com/codes/idaho/title-32/",
        "name": "Title 32 - Domestic Relations"
    },
    "Illinois": {
        "statutes": "https://law.justia.com/codes/illinois/chapter-750/",
        "name": "Chapter 750 - Families"
    },
    "Indiana": {
        "statutes": "https://law.justia.com/codes/indiana/title-31/",
        "name": "Title 31 - Family Law and Juvenile Law"
    },
    "Iowa": {
        "statutes": "https://law.justia.com/codes/iowa/title-xv/",
        "name": "Title XV - Judicial Branch and Judicial Procedures"
    },
    "Kansas": {
        "statutes": "https://law.justia.com/codes/kansas/chapter-23/",
        "name": "Chapter 23 - Domestic Relations"
    },
    "Kentucky": {
        "statutes": "https://law.justia.com/codes/kentucky/chapter-403/",
        "name": "Chapter 403 - Dissolution of Marriage"
    },
    "Louisiana": {
        "statutes": "https://law.justia.com/codes/louisiana/code-civil-code/code-book-i/",
        "name": "Civil Code Book I - Of Persons"
    },
    "Maine": {
        "statutes": "https://law.justia.com/codes/maine/title-19-a/",
        "name": "Title 19-A - Domestic Relations"
    },
    "Maryland": {
        "statutes": "https://law.justia.com/codes/maryland/family-law/",
        "name": "Family Law Article"
    },
    "Massachusetts": {
        "statutes": "https://law.justia.com/codes/massachusetts/part-ii/title-iii/chapter-208/",
        "name": "Chapter 208 - Divorce"
    },
    "Michigan": {
        "statutes": "https://law.justia.com/codes/michigan/chapter-722/",
        "name": "Chapter 722 - Children"
    },
    "Minnesota": {
        "statutes": "https://law.justia.com/codes/minnesota/chapters-517-519/",
        "name": "Chapters 517-519 - Marriage and Divorce"
    },
    "Mississippi": {
        "statutes": "https://law.justia.com/codes/mississippi/title-93/",
        "name": "Title 93 - Domestic Relations"
    },
    "Missouri": {
        "statutes": "https://law.justia.com/codes/missouri/title-xxx/",
        "name": "Title XXX - Domestic Relations"
    },
    "Montana": {
        "statutes": "https://law.justia.com/codes/montana/title-40/",
        "name": "Title 40 - Family Law"
    },
    "Nebraska": {
        "statutes": "https://law.justia.com/codes/nebraska/chapter-42/",
        "name": "Chapter 42 - Domestic Relations"
    },
    "Nevada": {
        "statutes": "https://law.justia.com/codes/nevada/title-11/",
        "name": "Title 11 - Domestic Relations"
    },
    "New Hampshire": {
        "statutes": "https://law.justia.com/codes/new-hampshire/title-xliii/",
        "name": "Title XLIII - Domestic Relations"
    },
    "New Jersey": {
        "statutes": "https://law.justia.com/codes/new-jersey/title-9/",
        "name": "Title 9 - Children and Domestic Relations"
    },
    "New Mexico": {
        "statutes": "https://law.justia.com/codes/new-mexico/chapter-40/",
        "name": "Chapter 40 - Domestic Affairs"
    },
    "New York": {
        "statutes": "https://law.justia.com/codes/new-york/domestic-relations/",
        "name": "Domestic Relations Law"
    },
    "North Carolina": {
        "statutes": "https://law.justia.com/codes/north-carolina/chapter-50/",
        "name": "Chapter 50 - Divorce and Alimony"
    },
    "North Dakota": {
        "statutes": "https://law.justia.com/codes/north-dakota/title-14/",
        "name": "Title 14 - Domestic Relations and Persons"
    },
    "Ohio": {
        "statutes": "https://law.justia.com/codes/ohio/title-31/",
        "name": "Title 31 - Domestic Relations"
    },
    "Oklahoma": {
        "statutes": "https://law.justia.com/codes/oklahoma/title-43/",
        "name": "Title 43 - Marriage and Family"
    },
    "Oregon": {
        "statutes": "https://law.justia.com/codes/oregon/title-11/",
        "name": "Title 11 - Domestic Relations"
    },
    "Pennsylvania": {
        "statutes": "https://law.justia.com/codes/pennsylvania/title-23/",
        "name": "Title 23 - Domestic Relations"
    },
    "Rhode Island": {
        "statutes": "https://law.justia.com/codes/rhode-island/title-15/",
        "name": "Title 15 - Domestic Relations"
    },
    "South Carolina": {
        "statutes": "https://law.justia.com/codes/south-carolina/title-63/",
        "name": "Title 63 - South Carolina Children's Code"
    },
    "South Dakota": {
        "statutes": "https://law.justia.com/codes/south-dakota/title-25/",
        "name": "Title 25 - Domestic Relations"
    },
    "Tennessee": {
        "statutes": "https://law.justia.com/codes/tennessee/title-36/",
        "name": "Title 36 - Domestic Relations"
    },
    "Texas": {
        "statutes": "https://law.justia.com/codes/texas/family-code/",
        "name": "Texas Family Code"
    },
    "Utah": {
        "statutes": "https://law.justia.com/codes/utah/title-30/",
        "name": "Title 30 - Husband and Wife"
    },
    "Vermont": {
        "statutes": "https://law.justia.com/codes/vermont/title-15/",
        "name": "Title 15 - Domestic Relations"
    },
    "Virginia": {
        "statutes": "https://law.justia.com/codes/virginia/title-20/",
        "name": "Title 20 - Domestic Relations"
    },
    "Washington": {
        "statutes": "https://law.justia.com/codes/washington/title-26/",
        "name": "Title 26 - Domestic Relations"
    },
    "West Virginia": {
        "statutes": "https://law.justia.com/codes/west-virginia/chapter-48/",
        "name": "Chapter 48 - Domestic Relations"
    },
    "Wisconsin": {
        "statutes": "https://law.justia.com/codes/wisconsin/chapter-767/",
        "name": "Chapter 767 - Actions Affecting the Family"
    },
    "Wyoming": {
        "statutes": "https://law.justia.com/codes/wyoming/title-20/",
        "name": "Title 20 - Domestic Relations"
    },
    "District of Columbia": {
        "statutes": "https://law.justia.com/codes/district-of-columbia/division-ii/",
        "name": "Division II - Family Relations"
    }
}

@api_router.get("/state-laws")
async def get_state_laws():
    return {"states": STATE_FAMILY_LAW_LINKS}

@api_router.get("/state-laws/{state}")
async def get_state_law(state: str):
    if state not in STATE_FAMILY_LAW_LINKS:
        raise HTTPException(status_code=404, detail="State not found")
    return {"state": state, "data": STATE_FAMILY_LAW_LINKS[state]}

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
        html_content = f"<h2>Family Court Records Export</h2>"
        html_content += f"<p>Sent by: {current_user['full_name']}</p>"
        html_content += f"<hr>"
        
        if request.content_type == "journals":
            journals = await db.journals.find(
                {"journal_id": {"$in": request.content_ids}, "user_id": current_user["user_id"]},
                {"_id": 0}
            ).to_list(100)
            
            for journal in journals:
                html_content += f"<h3>{journal['title']}</h3>"
                html_content += f"<p><strong>Date:</strong> {journal['date']}</p>"
                html_content += f"<p>{journal['content']}</p>"
                html_content += f"<hr>"
        
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
                html_content += f"<hr>"
        
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
            "events": events_count
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
