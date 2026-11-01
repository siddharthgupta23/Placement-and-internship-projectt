# Quick Start Guide - Placement Coordinator System

## What's New?
This is a complete placement management system with the following key features:

✅ **Coordinator Authentication** - Email/password login with JWT  
✅ **Company Registration Management** - Track companies as "Registering" or "Registered"  
✅ **Company Approval Workflow** - Coordinators can approve/reject new companies  
✅ **Student Applications** - Track which students applied to which companies/jobs  
✅ **Dashboard Analytics** - Real-time statistics on placements, applications, companies  
✅ **Complete Management** - Students, jobs, applications, and placements

---

## 5-Minute Setup

### 1. Start Backend Server
```bash
cd backend
npm install
npm start
```
✓ Server runs on `http://localhost:5000`

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
✓ Frontend runs on `http://localhost:5173`

### 3. Create Coordinator Account
Send a POST request to `http://localhost:5000/api/coordinator/register`:
```json
{
  "name": "Dr. Rajesh Kumar",
  "email": "coordinator@college.edu",
  "password": "Coordinator@123"
}
```

### 4. Login to Dashboard
Go to `http://localhost:5173`
- Email: `coordinator@college.edu`
- Password: `Coordinator@123`

---

## Key Features Explained

### 📊 Dashboard
Shows real-time statistics:
- **Total Students**: All enrolled students
- **Companies Registered (✓)**: Approved companies that can post jobs
- **Companies Registering (⏳)**: New companies pending approval
- **Students Placed**: Successfully placed students
- **Job Openings**: Active job postings
- **Total Applications**: Student applications submitted
- **Selected**: Students who got job offers

### 🏢 Companies Tab

#### Adding a Company
1. Coordinator fills company details
2. Company appears in "Companies Registering" section
3. Coordinator reviews and clicks **Approve** or **Reject**
4. Approved companies appear in "Registered Companies"
5. Only registered companies can post jobs

#### Company Status Workflow
```
New Company Added
    ↓
Status: "Registering" (Pending Approval)
    ↓
Coordinator Reviews
    ↓
[Approve] → Status: "Registered" (Can post jobs)
[Reject] →  Stay in "Registering" (Try again later)
```

### 👥 Students Tab
View all students with:
- Name, Email, Roll Number, CGPA
- Filter and search capabilities

### 📝 Applications Tab **(NEW)**
See all student applications:
- Which student applied to which company
- Job title they applied for
- Current status (Applied/Shortlisted/Selected/Rejected)
- When they applied

### 💼 Jobs Tab
View all job openings:
- Job title and company
- Location and salary
- Job description
- Application deadline

### ✅ Placements Tab
Track final placements:
- Student name and job
- Placement status
- Placement date

---

## Sample Workflow

### Scenario: Google wants to recruit from your college

**Step 1: Company Registration**
- Google registers with their details
- Appears in "Companies Registering" section
- Coordinator reviews and clicks "Approve"
- Google moves to "Registered Companies"

**Step 2: Google Posts Jobs**
- Google posts 3 Software Engineer positions
- Jobs appear in "Jobs" tab with Google's name
- Students can now apply to these positions

**Step 3: Students Apply**
- Arjun applies to Google's SWE job
- Priya applies to Google's SWE job
- Vikas applies to Google's SWE job
- All applications show in "Applications" tab with status "applied"

**Step 4: Final Placements**
- After interviews, Google selects Arjun and Priya
- Coordinator creates placement records
- Applications status changes to "selected"
- Placements tab shows both students as "placed" at Google

---

## Database Schema

### Companies
- `_id`: Unique ID
- `name`: Company name
- `email`: Company email (unique)
- `website`: Company website
- `description`: Company description
- **`status`**: "registering" or "registered" *(NEW)*
- **`registeredDate`**: Date when approved *(NEW)*
- `createdAt`, `updatedAt`: Timestamps

### Applications *(NEW)*
- `_id`: Unique ID
- `student`: Reference to Student
- `job`: Reference to Job
- `company`: Reference to Company
- `status`: "applied", "shortlisted", "selected", "rejected", "offer_accepted"
- `appliedOn`: When student applied
- `resume`: Uploaded resume (optional)
- `createdAt`, `updatedAt`: Timestamps

### Other Models
- **Student**: name, email, rollNumber, cgpa
- **Job**: company, title, description, location, salary, deadline
- **Placement**: student, job, company, status, placedOn
- **User**: name, email, password (hashed), role: "coordinator"

---

## Backend Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/coordinator/register` | Create coordinator account |
| POST | `/api/coordinator/login` | Login coordinator |
| GET | `/api/coordinator/stats` | Get dashboard statistics |
| GET | `/api/coordinator/companies` | Get all companies |
| GET | `/api/coordinator/companies/registered` | Get approved companies |
| GET | `/api/coordinator/companies/registering` | Get pending companies |
| POST | `/api/coordinator/companies` | Add new company |
| PATCH | `/api/coordinator/companies/:id/status` | Approve/reject company |
| GET | `/api/coordinator/applications` | Get all applications *(NEW)* |
| POST | `/api/coordinator/applications` | Create application *(NEW)* |
| GET | `/api/coordinator/students` | Get all students |
| GET | `/api/coordinator/jobs` | Get all jobs |
| GET | `/api/coordinator/placements` | Get all placements |

---

## Testing the System

### Option A: Manual Testing
1. Create coordinator account
2. Add companies manually
3. Approve companies
4. Add students
5. Create job postings
6. Track applications

### Option B: Populate with Sample Data
Run the test data script:
```bash
node SETUP_TEST_DATA.js
```
This creates:
- 5 sample students
- 5 sample companies (3 approved, 2 pending)
- 5 sample job postings

---

## Security Features

🔒 **Password Hashing**: Bcryptjs (10 salt rounds)  
🔒 **JWT Authentication**: Token-based with 8-hour expiration  
🔒 **Role-Based Access**: Only coordinators can access protected endpoints  
🔒 **CORS Protection**: Cross-origin requests validated  
🔒 **MongoDB Validation**: Schema validation on all documents  

---

## Session Persistence

The dashboard automatically saves your login session to browser localStorage:
- You stay logged in even after closing the browser
- Session expires when token expires (8 hours)
- Click "Logout" to clear session manually

---

## Troubleshooting

**Backend won't start**
- Check MongoDB connection in `.env`
- Ensure port 5000 is not in use
- Check Node.js version (v14+)

**Login fails**
- Verify coordinator account exists
- Check email spelling
- Reset password if forgotten (requires DB access)

**Companies not showing**
- Refresh the page
- Check browser console for errors
- Verify backend server is running

**API errors**
- Check backend logs in terminal
- Verify JWT token is valid
- Try logging out and logging in again

---

## Files Changed/Created

### Backend
- Updated: `models/Company.js` - Added status field
- Created: `models/Application.js` - New applications model
- Updated: `routes/coordinator.js` - Added company, application, stats endpoints
- Updated: `.env` - Changed PORT to 5000

### Frontend
- Updated: `pages/PlacementCoordinator.jsx` - Complete dashboard redesign

### Documentation
- Created: `PLACEMENT_COORDINATOR_GUIDE.md` - Full documentation
- Created: `SETUP_TEST_DATA.js` - Sample data generator
- This file: `QUICK_START.md` - Quick reference

---

## Next Steps

1. ✅ Setup backend and frontend
2. ✅ Create coordinator account
3. ✅ Login to dashboard
4. ✅ Add and approve companies
5. ✅ Add students and job postings
6. ✅ Track student applications
7. ✅ Manage placements

---

## Support

Need help? Check:
1. `PLACEMENT_COORDINATOR_GUIDE.md` - Detailed documentation
2. Backend logs - Terminal output from `npm start`
3. Browser console - DevTools (F12)
4. Network tab - Check API requests and responses

---

**Happy Placement Coordinating! 🎓**
