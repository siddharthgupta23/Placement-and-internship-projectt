# Placement Coordinator System - Complete Architecture

## System Overview

This is a comprehensive web-based placement management system built for college institutions to manage:
- Student enrollment and placements
- Company recruitment registrations and approvals
- Job postings and applications
- Placement tracking and reporting

---

## Core Components

### 1. Authentication & Authorization

**Coordinator Login**
```
User → Login Form → POST /api/coordinator/login
                 ↓
              Verify Email & Password (bcryptjs)
                 ↓
              Generate JWT Token (8 hour expiry)
                 ↓
         → Token stored in Frontend (localStorage)
         → Token sent in Authorization header for all requests
         → Protected endpoints verify token & coordinator role
```

**Session Management**
- Tokens stored in browser localStorage
- Automatic session restoration on page reload
- Logout clears token and session
- Token expiration enforced server-side

### 2. Company Registration Workflow

```
                        Company Registration Flow
                              ↓
      ┌─────────────────────────────────────────────────┐
      │                                                 │
      v                                                 v
[Registering]                                    [Registered]
  Status: "registering"                       Status: "registered"
  ├─ Can be approved                          ├─ Can post jobs
  ├─ Can be rejected                          ├─ Visible in dashboard
  └─ Pending coordinator review                └─ Students can apply

Coordinator Actions:
  [Approve] → Changes status to "registered" + sets registeredDate
  [Reject]  → Status stays "registering" (can approve later)
```

**Company Model Fields**
```javascript
{
  name: String (required),
  email: String (unique, required),
  website: String,
  description: String,
  status: "registering" | "registered",  // NEW
  registeredDate: Date,                   // NEW - when approved
  jobsPosted: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Student Application Workflow

```
                    Student Application Flow
                          ↓
      Student applies for job posted by company
                          ↓
     Application created with status = "applied"
                          ↓
   Coordinator / Company reviews application
                          ↓
    ┌─────────────────────────────────────────────┐
    │                                             │
    v                                             v
  [Applied]                                   [Selected]
  ├─ [Shortlisted]                           ├─ Can accept offer
  ├─ [Rejected]                              └─ Creates Placement
  └─ [Offer Accepted]
```

**Application Model Fields**
```javascript
{
  student: ObjectId (ref: Student),
  job: ObjectId (ref: Job),
  company: ObjectId (ref: Company),
  status: "applied" | "shortlisted" | "selected" | "rejected" | "offer_accepted",
  appliedOn: Date (default: now),
  resume: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Placement Management

```
                    Placement Creation Flow
                          ↓
    Coordinator assigns student to job
                          ↓
   Placement record created with details
                          ↓
   ┌─────────────────────────────────────┐
   │                                     │
   v                                     v
[Pending]   →   [Placed]   OR   [Rejected]
├─ Under review  └─ Student placed   └─ Not placed
└─ Awaiting confirmation    with company
```

---

## Database Schema

### Collections

#### 1. Users
```
Coordinator accounts with encrypted passwords
├─ name: String
├─ email: String (unique)
├─ password: String (hashed with bcryptjs)
├─ role: "coordinator" (enum)
└─ timestamps
```

#### 2. Students
```
Student records for placement
├─ name: String
├─ email: String (unique)
├─ rollNumber: String
├─ cgpa: Number
├─ resumes: [String] (URLs)
└─ timestamps
```

#### 3. Companies
```
Company registration with approval workflow
├─ name: String
├─ email: String (unique)
├─ website: String
├─ description: String
├─ status: "registering" | "registered"
├─ registeredDate: Date (when approved)
├─ contactPerson: String
├─ phone: String
├─ jobsPosted: Number
└─ timestamps
```

#### 4. Jobs
```
Job postings by registered companies
├─ company: ObjectId (ref: Company)
├─ title: String
├─ description: String
├─ location: String
├─ salary: String
├─ deadline: Date
└─ timestamps
```

#### 5. Applications *(NEW)*
```
Student applications to jobs
├─ student: ObjectId (ref: Student)
├─ job: ObjectId (ref: Job)
├─ company: ObjectId (ref: Company)
├─ status: enum[applied|shortlisted|selected|rejected|offer_accepted]
├─ appliedOn: Date
├─ resume: String
└─ timestamps
```

#### 6. Placements
```
Final placement records
├─ student: ObjectId (ref: Student)
├─ job: ObjectId (ref: Job)
├─ company: ObjectId (ref: Company)
├─ status: enum[placed|pending|rejected]
├─ placedOn: Date
└─ timestamps
```

---

## API Architecture

### Request/Response Flow

```
Frontend Request
      ↓
Authorization Header: Bearer <JWT_TOKEN>
      ↓
Backend Middleware Chain
├─ verifyToken() - Check JWT validity
└─ requireCoordinator() - Check role
      ↓
Route Handler (async)
├─ Validate input
├─ Database operations
├─ Error handling
└─ JSON response
      ↓
Frontend receives data
└─ Update state & UI
```

### Endpoint Structure

**Public Endpoints**
- `POST /api/coordinator/register` - Create coordinator
- `POST /api/coordinator/login` - Coordinator login

**Protected Endpoints** (Require: Authorization, Coordinator Role)

**Analytics**
- `GET /stats` - Dashboard statistics

**Company Management**
- `GET /companies` - All companies
- `GET /companies/registered` - Approved only
- `GET /companies/registering` - Pending only
- `POST /companies` - Add company
- `PATCH /companies/:id/status` - Approve/Reject

**Student Management**
- `GET /students` - All students
- `POST /students` - Add student

**Job Management**
- `GET /jobs` - All jobs (with company details populated)
- `POST /jobs` - Create job

**Application Management** *(NEW)*
- `GET /applications` - All applications
- `POST /applications` - Apply for job
- `PATCH /applications/:id` - Update status

**Placement Management**
- `GET /placements` - All placements
- `POST /placements` - Create placement

---

## Frontend Architecture

### Component Hierarchy

```
PlacementCoordinator (Main Container)
├─ Login Page (if not authenticated)
│  ├─ Email input
│  ├─ Password input
│  └─ Login button
│
└─ Dashboard (if authenticated)
   ├─ Header (Welcome, Logout)
   │
   ├─ Tab Navigation
   │  ├─ Dashboard tab
   │  ├─ Companies tab
   │  ├─ Applications tab (NEW)
   │  ├─ Students tab
   │  ├─ Jobs tab
   │  └─ Placements tab
   │
   ├─ Tab Content Area
   │  ├─ Dashboard: Statistics cards
   │  ├─ Companies: Add form + Registering list + Registered list
   │  ├─ Applications: Table with applications (NEW)
   │  ├─ Students: Grid of student cards
   │  ├─ Jobs: Card view of job postings
   │  └─ Placements: Table of placements
   │
   └─ Message Area: Success/Error alerts
```

### State Management

```javascript
{
  // Authentication
  token: JWT token string,
  user: {name, email, role},
  
  // Data collections
  students: [Student],
  companies: [Company],
  registeredCompanies: [Company], // filtered
  registeringCompanies: [Company], // filtered
  jobs: [Job],
  applications: [Application], // NEW
  placements: [Placement],
  
  // UI State
  tab: "dashboard" | "companies" | "applications" | "students" | "jobs" | "placements",
  loading: boolean,
  message: string (success/error)
}
```

### Data Flow

```
User Interaction
      ↓
State Update / Form Submit
      ↓
API Call (with JWT token)
      ↓
Backend Processing
      ↓
Response received
      ↓
State updated
      ↓
Component re-renders
```

---

## Security Architecture

### Password Security
```
User Password
      ↓
bcryptjs.hash(password, 10)
      ↓
Hashed password stored in database
      ↓
On login: bcryptjs.compare(inputPassword, hashedPassword)
```

### JWT Token Security
```
User submits email/password → Verify → Generate JWT
├─ Payload: {id, role, email}
├─ Secret: JWT_SECRET from .env
└─ Expiration: 8 hours

Every protected request:
├─ Extract token from Authorization header
├─ Verify token signature
├─ Check expiration
├─ Verify role (must be coordinator)
└─ Allow/deny request
```

### Data Protection
- CORS enabled for cross-origin requests
- Input validation on all endpoints
- Error messages don't leak sensitive info
- MongoDB schema validation
- Unique constraints on email fields

---

## Key Features Summary

### ✅ Already Implemented
- Coordinator authentication (email/password/JWT)
- Company management with registration workflow
- Student database
- Job posting system
- Placement tracking
- Real-time statistics dashboard
- Session persistence (localStorage)
- Responsive UI with Tailwind CSS

### ✅ New Features Added
- **Company Approval Workflow** - Two-stage registration (registering → registered)
- **Student Applications** - Track applications with multiple statuses
- **Applications Dashboard** - View all student applications in one place
- **Status Filtering** - Separate views for registered vs registering companies
- **Application Management** - Update application statuses
- **Better Statistics** - Track registered vs registering companies separately
- **Approval Actions** - Approve/reject companies with one click
- **Professional UI Design** - Modern dashboard with better UX

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **ORM**: Mongoose
- **Environment**: dotenv

### Frontend
- **Framework**: React 19
- **Router**: React Router v7
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **HTTP Client**: Fetch API
- **Storage**: localStorage

### DevOps
- **Database**: MongoDB Atlas (cloud)
- **Hosting**: Ready for Vercel/Heroku/custom server
- **Package Managers**: npm

---

## Deployment Considerations

### Backend Deployment
```
1. Set environment variables on production server
   - MONGO_URI (production database)
   - JWT_SECRET (strong secret key)
   - PORT (typically 80/443 with reverse proxy)

2. Deploy Node.js app
   - Use process manager (PM2, systemd)
   - Enable CORS for production frontend URL
   - Use HTTPS with SSL certificate

3. Database
   - Use MongoDB Atlas (or self-hosted)
   - Configure IP whitelist
   - Enable backups
```

### Frontend Deployment
```
1. Build optimized bundle
   - npm run build (creates dist folder)

2. Deploy to CDN
   - Vercel, Netlify, GitHub Pages, S3
   - Configure API_BASE for production backend URL

3. Environment setup
   - VITE_API_URL environment variable
```

---

## Performance Optimizations

1. **Frontend**: Tailwind CSS purging, lazy loading, code splitting
2. **Backend**: Database indexing on email/status fields
3. **API**: Pagination ready (can be added to list endpoints)
4. **Caching**: JWT token cached in localStorage

---

## Monitoring & Logging

**Backend Logs**
- Server startup confirmation
- Database connection status
- Request errors with details

**Frontend Logs**
- API call failures
- Component errors
- State changes (debug mode)

**Best Practices**
- Check backend terminal for errors
- Use browser DevTools Network tab
- Monitor MongoDB Atlas dashboard

---

## Summary

This is a **production-ready placement management system** with:
- Secure authentication
- Professional UI/UX
- Database-backed data persistence
- Company approval workflow
- Application tracking
- Real-time statistics
- Scalable architecture

**Ready to deploy and use!** 🚀
