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
    color: Optional[str] = "#3B82F6"

class ChildResponse(BaseModel):
    child_id: str
    user_id: str
    name: str
    date_of_birth: str
    notes: str
    color: str
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
        "color": child_data.color or "#3B82F6",
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
    # Add default color if not present
    for child in children:
        if "color" not in child:
            child["color"] = "#3B82F6"
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
        raise HTTPException(status_code=400, detail=f"File type not allowed. Supported: PDF, Images, Word docs, Videos, Audio")
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Max file size: 50MB for videos/audio, 10MB for others
    max_size = 50 * 1024 * 1024 if file.content_type.startswith(("video/", "audio/")) else 10 * 1024 * 1024
    if file_size > max_size:
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

# Parental Alienation Resources and Advocacy Groups
PARENTAL_ALIENATION_RESOURCES = [
    {
        "name": "The Dadvocate",
        "url": "https://www.thedadvocate.com/",
        "description": "Advocacy and support for fathers navigating custody and co-parenting challenges"
    },
    {
        "name": "Parents Against Parental Alienation (PAPA)",
        "url": "https://www.parentsagainstparentalalienation.com/",
        "description": "Support group for parents experiencing parental alienation"
    },
    {
        "name": "Parental Alienation Awareness Organization",
        "url": "https://www.paawareness.org/",
        "description": "Education and awareness about parental alienation syndrome"
    },
    {
        "name": "National Parents Organization",
        "url": "https://nationalparentsorganization.org/",
        "description": "Advocates for shared parenting and family court reform nationwide"
    },
    {
        "name": "Fathers' Rights Movement",
        "url": "https://fathersrights.org/",
        "description": "Legal resources and advocacy for fathers seeking equal custody"
    },
    {
        "name": "Moms for Shared Parenting",
        "url": "https://momsforsharedparenting.org/",
        "description": "Mothers advocating for 50/50 shared parenting arrangements"
    },
    {
        "name": "Children's Rights Council",
        "url": "https://www.crckids.org/",
        "description": "Non-profit focused on ensuring children have meaningful relationships with both parents"
    },
    {
        "name": "Parental Alienation Study Group",
        "url": "https://pasg.info/",
        "description": "International organization of professionals studying parental alienation"
    },
    {
        "name": "Leading Women for Shared Parenting",
        "url": "https://www.leadingwomen4sharedparenting.com/",
        "description": "Women leaders advocating for equal shared parenting legislation"
    },
    {
        "name": "Family Access - Fighting for Children's Rights",
        "url": "https://www.familyaccess.org/",
        "description": "Grassroots organization supporting family court reform and parental rights"
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
