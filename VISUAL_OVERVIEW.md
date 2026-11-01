# Placement Coordinator System - Visual Overview

## 🎯 What You've Built

A **professional placement management system** where placement coordinators can:
- ✅ Login securely with email/password
- ✅ Approve/reject company registrations  
- ✅ Track student applications to jobs
- ✅ Manage placements and view analytics
- ✅ See real-time dashboard statistics

---

## 📊 System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  PLACEMENT MANAGEMENT SYSTEM            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐      ┌──────────────────────┐ │
│  │   COORDINATOR       │      │    FRONTEND UI       │ │
│  │   (This You)        │      │   (React + Tailwind) │ │
│  ├─────────────────────┤      ├──────────────────────┤ │
│  │ • Login             │      │ • Login Page         │ │
│  │ • Dashboard         │      │ • Dashboard (8 stats)│ │
│  │ • Approve Companies │      │ • Companies Tab      │ │
│  │ • Track Apps        │      │ • Applications Tab   │ │
│  │ • View Stats        │      │ • Students Tab       │ │
│  │ • Manage Placement  │      │ • Jobs Tab           │ │
│  │                     │      │ • Placements Tab     │ │
│  └──────────┬──────────┘      └─────────┬────────────┘ │
│             │                          │               │
│             │      HTTP / JSON         │               │
│             └──────────────┬───────────┘               │
│                            │                           │
│                   ┌────────▼─────────┐                 │
│                   │  BACKEND API     │                 │
│                   │ (Node + Express) │                 │
│                   ├──────────────────┤                 │
│                   │ • Auth Endpoints │                 │
│                   │ • Company CRUD   │                 │
│                   │ • Application    │                 │
│                   │ • Statistics     │                 │
│                   │ • Protected Data │                 │
│                   └────────┬─────────┘                 │
│                            │                           │
│                   ┌────────▼─────────┐                 │
│                   │   MONGODB        │                 │
│                   │   (Cloud Atlas)  │                 │
│                   ├──────────────────┤                 │
│                   │ • Users          │                 │
│                   │ • Companies      │                 │
│                   │ • Students       │                 │
│                   │ • Jobs           │                 │
│                   │ • Applications   │                 │
│                   │ • Placements     │                 │
│                   └──────────────────┘                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Company Registration Flow

```
┌─────────────────────────────────────────────────────┐
│        COMPANY REGISTRATION WORKFLOW                │
└─────────────────────────────────────────────────────┘

Step 1: Add Company
────────────────────
  Coordinator fills form:
  ├─ Company Name: "TCS"
  ├─ Email: "recruitment@tcs.com"
  ├─ Website: "https://www.tcs.com"
  └─ Description: "..."
  
  Company created with status = "REGISTERING"
  │
  │
  ▼
  
Step 2: View in Dashboard
─────────────────────────
  Companies Tab → "Companies Registering" Section
  ├─ TCS [Status: REGISTERING]
  │  ├─ [APPROVE] Button  ◄── Coordinator clicks
  │  └─ [REJECT] Button
  │
  │
  ▼
  
Step 3: Approval
────────────────
  Database Update:
  ├─ status: "REGISTERING" → "REGISTERED" ✓
  ├─ registeredDate: Set to current date/time
  └─ Saved to MongoDB
  
  Frontend Update:
  ├─ Company removed from "Registering" list
  └─ Company added to "Registered" list
  │
  │
  ▼
  
Step 4: Company Ready
──────────────────────
  Companies Tab → "Registered Companies" Section
  ├─ TCS [Status: REGISTERED ✓]
  ├─ Email: recruitment@tcs.com
  ├─ Registered: Feb 23, 2026
  └─ Can now post jobs!
```

---

## 📱 Student Application Flow

```
┌──────────────────────────────────────────────────────┐
│       STUDENT APPLICATION WORKFLOW                  │
└──────────────────────────────────────────────────────┘

Step 1: Student Applies
───────────────────────
  Student Portal (build later):
  ├─ Logs in
  ├─ Sees "TCS - Software Engineer" job
  └─ Clicks "Apply"
  
  Application Created:
  ├─ student: Arjun Sharma
  ├─ job: Software Engineer at TCS
  ├─ company: TCS
  ├─ status: "APPLIED"
  └─ appliedOn: Today's date
  │
  │
  ▼
  
Step 2: View in Dashboard
─────────────────────────
  Applications Tab Table:
  ┌─────────────┬──────────┬──────────┬────────┬────────┐
  │ Student     │ Company  │ Job      │ Status │ Applied│
  ├─────────────┼──────────┼──────────┼────────┼────────┤
  │ Arjun Sh.   │ TCS      │ SWE      │APPLIED │ Today  │
  │ Priya Patel │ Infosys  │ Dev      │APPLIED │ Today  │
  │ Rahul Singh │ Wipro    │ QA       │APPLIED │ Today  │
  └─────────────┴──────────┴──────────┴────────┴────────┘
  
  Coordinator can see all applications at once!
  │
  │
  ▼

Step 3: Update Status
────────────────────
  Coordinator (future feature):
  ├─ Change status to "SHORTLISTED"
  ├─ Change status to "SELECTED"
  ├─ Change status to "REJECTED"
  └─ Change status to "OFFER_ACCEPTED"
  
  Application status updates in real-time
  │
  │
  ▼

Step 4: Create Placement
───────────────────────
  For selected candidates:
  Placements Tab:
  ├─ Student: Arjun Sharma
  ├─ Company: TCS
  ├─ Job: Software Engineer
  ├─ Status: PLACED
  └─ Placement Date: Feb 23, 2026
```

---

## 📊 Dashboard Statistics

```
┌──────────────────────────────────────────────────────┐
│           DASHBOARD STATISTICS CARDS                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ 👥 Students      │  │ ✓ Companies Reg. │         │
│  │      50          │  │      10          │         │
│  └──────────────────┘  └──────────────────┘         │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ ⏳ Companies Reg │  │ 🎯 Students Plc. │         │
│  │       5          │  │      30          │         │
│  └──────────────────┘  └──────────────────┘         │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ 💼 Job Open.     │  │ 📝 Applications  │         │
│  │      25          │  │     120          │         │
│  └──────────────────┘  └──────────────────┘         │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ 📥 Applied       │  │ 🌟 Selected      │         │
│  │      80          │  │      40          │         │
│  └──────────────────┘  └──────────────────┘         │
│                                                      │
└──────────────────────────────────────────────────────┘

Real-time updates from database!
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│         COORDINATOR LOGIN PROCESS                  │
└─────────────────────────────────────────────────────┘

Step 1: Enter Credentials
──────────────────────────
  Login Form:
  ├─ Email: coordinator@college.edu
  ├─ Password: ••••••••••
  └─ Click [Login]
  │
  │ HTTPS Request
  ▼

Step 2: Backend Verification
──────────────────────────────
  Server:
  ├─ Find user by email
  ├─ Compare password with hash (bcryptjs)
  ├─ If match:
  │  ├─ Generate JWT Token
  │  │  ├─ Payload: {id, role, email}
  │  │  └─ Expiry: 8 hours
  │  └─ Send token + user info
  └─ If no match:
     └─ Send error message
  │
  │ Response with JWT
  ▼

Step 3: Frontend Stores Token
──────────────────────────────
  Browser:
  ├─ Save token to localStorage
  ├─ Save user info to localStorage
  ├─ Add token to all API headers
  └─ Redirect to dashboard
  │
  │
  ▼

Step 4: Protected Requests
──────────────────────────
  Every API call includes:
  ├─ Authorization: Bearer [JWT_TOKEN]
  │
  Server verifies:
  ├─ Token exists ✓
  ├─ Token not expired ✓
  ├─ User is coordinator ✓
  └─ Grant access to data
  │
  │
  ▼

Step 5: Logout
──────────────
  Coordinator clicks Logout:
  ├─ Clear localStorage
  ├─ Clear token
  └─ Redirect to login page
  
  Session ended, must login again!
```

---

## 🎨 UI Tabs & Views

```
┌──────────────────────────────────────────────────┐
│         PLACEMENT COORDINATOR DASHBOARD          │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Dashboard] [Companies] [Applications] [...]    │
│  ▔▔▔▔▔▔▔▔▔   ▔▔▔▔▔▔▔▔▔▔  ▔▔▔▔▔▔▔▔▔▔▔▔▔  ▔▔▔▔▔ │
│                                                  │
│  DASHBOARD TAB                                   │
│  ├─ 8 Statistics Cards                          │
│  │  ├─ Total Students                           │
│  │  ├─ Companies Registered                     │
│  │  ├─ Companies Registering                    │
│  │  ├─ Students Placed                          │
│  │  ├─ Job Openings                             │
│  │  ├─ Total Applications                       │
│  │  ├─ Applied (Pending)                        │
│  │  └─ Selected                                 │
│  └─ Real-time Updates                           │
│                                                  │
│  COMPANIES TAB                                   │
│  ├─ Add Company Form                            │
│  ├─ "Registering" Section (Amber)               │
│  │  ├─ Cards showing pending companies          │
│  │  ├─ [Approve] Button                         │
│  │  └─ [Reject] Button                          │
│  └─ "Registered" Section (Green)                │
│     ├─ Cards showing approved companies         │
│     └─ Registration date displayed              │
│                                                  │
│  APPLICATIONS TAB (NEW!)                         │
│  ├─ Table of all student applications           │
│  ├─ Columns:                                    │
│  │  ├─ Student Name                             │
│  │  ├─ Company                                  │
│  │  ├─ Job Title                                │
│  │  ├─ Status (color-coded)                     │
│  │  └─ Applied Date                             │
│  └─ View all applications in one place!         │
│                                                  │
│  STUDENTS TAB                                    │
│  ├─ Grid of all students                        │
│  └─ Cards showing: Name, Email, Roll, CGPA     │
│                                                  │
│  JOBS TAB                                        │
│  ├─ Grid of job openings                        │
│  └─ Cards showing: Title, Company, Loc, Salary │
│                                                  │
│  PLACEMENTS TAB                                  │
│  ├─ Table of all placements                     │
│  └─ Columns: Student, Company, Job, Status, Date
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 📦 Data Models

```
┌─────────────────────────────────────────────────┐
│          DATABASE COLLECTIONS                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ User (Coordinator)                              │
│ ├─ _id                                          │
│ ├─ name: "Dr. Rajesh Kumar"                    │
│ ├─ email: "coordinator@college.edu"            │
│ ├─ password: "[HASHED]"                        │
│ └─ role: "coordinator"                         │
│                                                 │
│ Company (UPDATED!)                              │
│ ├─ _id                                          │
│ ├─ name: "TCS"                                 │
│ ├─ email: "recruitment@tcs.com"                │
│ ├─ website: "https://www.tcs.com"              │
│ ├─ description: "IT Services"                  │
│ ├─ status: "registering" | "registered" ✨    │
│ ├─ registeredDate: 2026-02-23 ✨               │
│ └─ timestamps                                  │
│                                                 │
│ Student                                         │
│ ├─ _id                                          │
│ ├─ name: "Arjun Sharma"                        │
│ ├─ email: "arjun@college.edu"                  │
│ ├─ rollNumber: "2021001"                       │
│ └─ cgpa: 7.5                                   │
│                                                 │
│ Job                                             │
│ ├─ _id                                          │
│ ├─ company: [Company_id]                       │
│ ├─ title: "Software Engineer"                  │
│ ├─ description: "..."                          │
│ ├─ location: "Bangalore"                       │
│ ├─ salary: "5-8 LPA"                           │
│ └─ deadline: 2026-03-23                        │
│                                                 │
│ Application (NEW!)                              │
│ ├─ _id                                          │
│ ├─ student: [Student_id]                       │
│ ├─ job: [Job_id]                               │
│ ├─ company: [Company_id]                       │
│ ├─ status: "applied|shortlisted|selected..." ✨│
│ ├─ appliedOn: 2026-02-23                       │
│ └─ resume: "path/to/resume.pdf"                │
│                                                 │
│ Placement                                       │
│ ├─ _id                                          │
│ ├─ student: [Student_id]                       │
│ ├─ job: [Job_id]                               │
│ ├─ company: [Company_id]                       │
│ ├─ status: "placed|pending|rejected"           │
│ └─ placedOn: 2026-02-23                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

```
┌──────────────────────────────────────────────────┐
│         API ENDPOINTS AVAILABLE                  │
├──────────────────────────────────────────────────┤

PUBLIC (No Auth Required)
─────────────────────────
POST   /api/coordinator/register
POST   /api/coordinator/login

PROTECTED (JWT Token + Coordinator Role Required)
──────────────────────────────────────────────────
GET    /api/coordinator/stats
GET    /api/coordinator/companies
GET    /api/coordinator/companies/registered
GET    /api/coordinator/companies/registering
POST   /api/coordinator/companies
PATCH  /api/coordinator/companies/:id/status

GET    /api/coordinator/applications (NEW!)
POST   /api/coordinator/applications (NEW!)
PATCH  /api/coordinator/applications/:id (NEW!)

GET    /api/coordinator/students
POST   /api/coordinator/students
GET    /api/coordinator/jobs
POST   /api/coordinator/jobs
GET    /api/coordinator/placements
POST   /api/coordinator/placements

└──────────────────────────────────────────────────┘
```

---

## 🚀 Technology Stack

```
┌──────────────────────────────────────────────────┐
│            TECHNOLOGY STACK                      │
├──────────────────────────────────────────────────┤

FRONTEND
├─ React 19
├─ React Router v7
├─ Tailwind CSS
├─ Vite (Build tool)
└─ Fetch API

BACKEND
├─ Node.js
├─ Express.js
├─ MongoDB + Mongoose
├─ JWT (Authentication)
├─ bcryptjs (Password hashing)
└─ CORS enabled

DATABASE
├─ MongoDB Atlas (Cloud)
├─ 6 Collections
├─ Automatic backups
└─ Indexes on key fields

SECURITY
├─ HTTPS ready
├─ Password hashing
├─ JWT tokens
├─ Role-based access
└─ Input validation

└──────────────────────────────────────────────────┘
```

---

## ✨ Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| **Coordinator Login** | ✅ Complete | Email/password with JWT |
| **Company Management** | ✅ Complete | Add, approve, reject companies |
| **Company Status** | ✅ NEW | Registering vs Registered workflow |
| **Application Tracking** | ✅ NEW | Track student applications |
| **Applications Dashboard** | ✅ NEW | Dedicated applications tab |
| **Student Management** | ✅ Complete | View all students |
| **Job Management** | ✅ Complete | Create and view jobs |
| **Placement Management** | ✅ Complete | Create and track placements |
| **Dashboard Analytics** | ✅ Complete | 8 real-time statistics |
| **Session Persistence** | ✅ Complete | Stay logged in across sessions |
| **Professional UI** | ✅ Complete | Modern design with Tailwind |
| **Security** | ✅ Complete | Hashing, JWT, role-based access |
| **Documentation** | ✅ Complete | 8 comprehensive guides |

---

**All implemented and ready to use!** 🎉
