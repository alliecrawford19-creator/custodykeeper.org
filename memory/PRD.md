# CustodyKeeper - Family Court Record-Keeping App

## Original Problem Statement
Build an all-in-one app for parents to keep records for family court purposes, including:
- User accounts for individual parents
- Upload family court orders (PDF, Images, Word documents)
- Written journal of time spent with children
- Violations log against other parent for evidentiary purposes
- Focus on parental alienation documentation
- Calendar to track parenting time
- Save, send, export documents and journals
- State family court law reference links

## User Choices
1. **Authentication**: JWT-based custom auth (email/password)
2. **Document Upload**: PDF, Images (JPG, PNG), Word documents
3. **State Law Reference**: Simple links to official state court websites
4. **Export/Share**: Download + Email sharing
5. **Design Theme**: Warm and friendly, professional legal look

## User Personas
- **Primary**: Parents involved in family court custody disputes
- **Secondary**: Parents documenting parental alienation cases
- **Tertiary**: Family law attorneys needing organized client records

## Core Requirements
- Secure user authentication with JWT tokens
- Document upload with 10MB limit, base64 storage
- Journal entries with date, mood, location, children tracking
- Violation logging with type, severity, witnesses, evidence notes
- Calendar for parenting time, court dates, visitations
- All 50 US states + DC court website links
- Export to JSON, Email sharing capability

## Architecture

### Backend (FastAPI + MongoDB)
- `/app/backend/server.py` - Main API server
- Collections: users, children, journals, violations, documents, calendar_events

### Frontend (React + Tailwind + Shadcn)
- `/app/frontend/src/pages/` - All page components
- `/app/frontend/src/components/` - Shared components

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `CRUD /api/children` - Children management
- `CRUD /api/journals` - Journal entries
- `CRUD /api/violations` - Violation logs
- `CRUD /api/documents` - Document upload/management
- `CRUD /api/calendar` - Calendar events
- `GET /api/state-laws` - State court links
- `GET /api/export/journals` - Export journals
- `GET /api/export/violations` - Export violations
- `POST /api/send-email` - Email sharing

## What's Been Implemented (Feb 9, 2026)

### Phase 1 - MVP Complete ✅
- [x] User authentication (register/login/logout)
- [x] Dashboard with stats, quick actions, upcoming events
- [x] **Court Date Countdown Widget** - Shows days/hours until next court date
- [x] **Dashboard Clickable Events** - Click events to view details with edit option
- [x] Parenting Journal with CRUD, search, export, email
- [x] Violation Log with type, severity, witnesses, export, email
- [x] Document upload (PDF, Images, Word, Videos, Audio) with categories
- [x] **Calendar with Full Edit Support** - Create, Read, Update, Delete events
- [x] **Calendar Children Association** - Link children to events with color coding
- [x] **Calendar Group Events** - Custom colors for multi-child events
- [x] State Laws/Support & Advocacy page with parental alienation resources
- [x] Settings page with children management (photo upload, color selection)
- [x] **Contacts Management** - Full CRUD for case-related contacts
- [x] **Photo Uploads** - User profile, children, and contacts photos
- [x] Warm professional design with Merriweather/Lato fonts
- [x] Mobile responsive design

### Recent Updates (Feb 9, 2026)
- ✅ Calendar Enhancements:
  - Added edit functionality for all calendar entries
  - Removed "Parenting Time" and "Child Exchange" event types
  - Added new event types: Visitation, Medical Appointment, School Event
  - Children can be associated with events (uses child's color)
  - Group events (multiple children) can have custom color
- ✅ Dashboard Clickable Events:
  - Events in "Upcoming Events" section are now clickable
  - Opens detail dialog with event info (title, date, location, notes)
  - "Edit in Calendar" button navigates to Calendar page
- ✅ Universal Edit Functionality:
  - Journals: Edit working
  - Violations: Edit working
  - Contacts: Edit working
  - Children: Edit working
  - Calendar Events: Edit working (NEW)
- ✅ Bug Fix: Dialog overlay blocking clicks (fixed bg-white to bg-black/60)

### Testing Results
- Backend: 100% pass rate
- Frontend: 100% pass rate
- All CRUD operations verified across Calendar, Violations, Journals, Contacts

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] PDF export for journals and violations (court-ready format)
- [ ] Document preview/viewer in-app
- [ ] Mobile-responsive polish for on-the-go use

### P1 - High Priority
- [ ] Recurring calendar events
- [ ] Notification reminders for upcoming events
- [ ] Photo/evidence attachment to journal entries
- [ ] Court date countdown widget

### P2 - Nice to Have
- [ ] Multi-child filtering in journals
- [ ] Timeline/history view of all records
- [ ] Print-friendly export formatting
- [ ] Attorney collaboration/sharing mode
- [ ] Dark mode theme option

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt password hashing
- **Email**: Resend API (requires configuration)

## Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing secret
- `RESEND_API_KEY` - Email service API key (optional)
- `SENDER_EMAIL` - Email sender address (optional)
- `REACT_APP_BACKEND_URL` - Backend API URL for frontend
