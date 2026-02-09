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
- [x] Dashboard with stats, quick actions, upcoming events (view only)
- [x] **Court Date Countdown Widget** - Shows days/hours until next court date
- [x] **Dashboard Clickable Events** - Click events to view details (read-only popup)
- [x] Parenting Journal with CRUD, search, export, email, **photo evidence uploads**
- [x] Violation Log with type, severity, witnesses, export, email
- [x] Document upload (PDF, Images, Word, Videos, Audio) with categories & **in-app preview**
- [x] **Calendar with Full Edit Support** - Create, Read, Update, Delete events
- [x] **Calendar Children Association** - Link children to events with color coding
- [x] **Calendar Group Events** - Custom colors for multi-child events
- [x] **Recurring Calendar Events** - Daily, Weekly, Bi-weekly, Monthly patterns
- [x] State Laws/Support & Advocacy page with parental alienation resources
- [x] Settings page with children management (photo upload, color selection)
- [x] **Contacts Management** - Full CRUD for case-related contacts
- [x] **Photo Uploads** - User profile, children, and contacts photos
- [x] Warm professional design with Merriweather/Lato fonts
- [x] Mobile responsive design

### Phase 2 - Enhanced Features Complete ✅ (Feb 9, 2026)
- [x] **Dark Mode Theme** - Toggle in header, persists via localStorage
- [x] **Timeline/History View** - Chronological view of all records at /timeline
- [x] **Multi-Child Filtering in Journals** - Filter entries by specific child
- [x] **Print-Friendly Export** - Print buttons on Journals and Violations pages
- [x] **PDF Export** - Court-ready PDF generation for Journals and Violations
- [x] **Notification Reminders** - Browser notifications for events within 24 hours
- [x] **Photo/Evidence Attachments** - Add photos to journal entries
- [x] **Attorney Sharing Mode** - Create secure, expiring read-only share links at /sharing

### Phase 3 - UI/UX Polish ✅ (Feb 9, 2026)
- [x] All dialog popups have solid white backgrounds
- [x] Landing page: Removed "Get Started" button, changed to "Start Documenting Today"
- [x] Dashboard: Event popup is now view-only (removed Edit button)

### Phase 4 - Calendar Enhancements ✅ (Feb 9, 2026)
- [x] **Recurring Event Editing** - Dialog to choose "Edit this event only" or "Edit all events in series"
- [x] **Exception System** - Creates standalone events linked via `parent_event_id`, auto-updates parent's `exception_dates`
- [x] **Print-Friendly Calendar Export** - Export PDF and Print buttons in calendar header
- [x] **Mobile Responsive Calendar** - Optimized layout for smaller screens

### Phase 5 - Code Quality & Bug Fixes ✅ (Feb 9, 2026)
- [x] **White Popup Text Fix** - Fixed text visibility on white dialog popups (dialog, sheet, popover, dropdown, select, alert-dialog)
- [x] **Component Refactoring** - SettingsPage split into ProfileSection + ChildrenSection components
- [x] **Component Refactoring** - LandingPage split into Navbar, HeroSection, FeatureSection, ResearchSection, DocumentationSection, Footer components
- [x] New component directories: `/src/components/settings/` and `/src/components/landing/`
- [x] **Dashboard User Menu Fix** - Fixed avatar dropdown not opening (z-index increased to z-[100])
- [x] **Violations Dropdown Text Fix** - Added explicit text color to "All Severities" filter dropdown
- [x] **Documents Dropdown Text Fix** - Added explicit text color to "All Categories" filter dropdown

### Phase 6 - P2 Security & Export Features ✅ (Feb 9, 2026)
- [x] **Export All Data as ZIP** - Download all records (journals, violations, calendar, documents, contacts) as organized ZIP archive
- [x] **Two-Factor Authentication (2FA)** - Email-based verification codes with toggle in Security Settings
- [x] **Advanced Sharing Permissions** - Three permission levels for attorney sharing: View Only, View & Print, Full Access
- [x] **SecuritySection component** - New settings component for 2FA management
- [x] **ExportDataSection component** - New settings component for data export

### Phase 7 - Performance, i18n & Import Features ✅ (Feb 9, 2026)
- [x] **Multi-Language Support (i18n)** - English, Spanish, French translations with language selector in Settings
- [x] **Data Import from CSV** - Import journals, violations, calendar events from CSV files with template downloads
- [x] **API Pagination** - Journals and violations endpoints support page/page_size params for large data sets
- [x] **Database Indexes** - Indexes created on startup for better query performance
- [x] **Mobile Touch Targets** - CSS optimizations for 44px minimum touch targets
- [x] **Mobile UI Optimizations** - Better spacing, scrolling, and responsive dialogs

### Testing Results
- Backend: 100% pass rate
- Frontend: 100% pass rate
- All features verified working

## Prioritized Backlog

### P0 - Critical (COMPLETED Feb 9, 2026)
- [x] Mobile-responsive polish for on-the-go use
- [x] Recurring event editing (edit all instances vs single) - implemented with exception_dates system
- [x] Print-friendly export for calendar - Export PDF and Print buttons added

### P1 - High Priority
- [x] Component refactoring (SettingsPage, LandingPage into smaller components) ✅ Feb 9, 2026
- [x] White popup text visibility fix ✅ Feb 9, 2026

### P2 - Nice to Have (COMPLETED Feb 9, 2026)
- [x] **Export All Data as ZIP** - One-click download of all user data (journals, violations, calendar, documents, contacts)
- [x] **Advanced Sharing Permissions** - Permission levels: View Only, View & Print, Full Access
- [x] **Two-Factor Authentication** - Email-based verification codes for enhanced security

### Future Enhancements
- [ ] Advanced sharing permissions (edit access for attorneys)
- [ ] Two-factor authentication
- [ ] Export all data as ZIP archive

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
