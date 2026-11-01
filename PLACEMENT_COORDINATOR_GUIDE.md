# Placement Coordinator Dashboard - Setup & Usage Guide

## Overview
This placement management system allows placement coordinators to manage student placements, company registrations, job postings, and student applications through a secure web interface.

## Features

### Coordinator Authentication
- Email and password login for placement coordinators
- JWT token-based authentication
- LocalStorage session persistence
- Secure logout

### Dashboard Analytics
- Total students, companies, and job openings
- Companies registered vs registering
- Students placed count
- Application statistics

### Company Management
- Add new companies to the system
- View companies awaiting approval (Registering)
- Approve/reject company registrations
- View all registered companies with registration dates
- Track company details: name, email, website, description

### Student Management
- View all registered students
- Student information: name, email, roll number, CGPA
- Track student placement status

### Job Management
- Create job postings linked to registered companies
- View all job openings
- Track job details: title, description, location, salary, deadline

### Application Management
- View all student applications (**new feature**)
- Track application status: Applied, Shortlisted, Selected, Rejected, Offer Accepted
- View which student applied to which company/job
- See application timeline

### Placement Management
- Assign students to job placements
- Track placement status: Placed, Pending, Rejected
- View placement records with dates

---

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables (.env)
```
MONGO_URI=mongodb+srv://[username]:[password]@[cluster]/[dbname]
JWT_SECRET=your_secret_key_here
PORT=5000
```

### 3. MongoDB Models
The system uses the following models:

- **User**: Coordinator accounts (name, email, password hashed, role)
- **Student**: Student records (name, email, rollNumber, cgpa)
- **Company**: Company info with status field (name, email, website, description, status: 'registering'|'registered')
- **Job**: Job postings (company, title, description, location, salary, deadline)
- **Application**: Student applications to jobs (student, job, company, status, appliedOn)
- **Placement**: Final placement records (student, job, company, status, placedOn)

### 4. Create Initial Coordinator Account
```bash
# POST /api/coordinator/register
{
  "name": "Coordinator Name",
  "email": "coordinator@college.edu",
  "password": "securepassword"
}
```

### 5. Run Backend Server
```bash
npm start
# Server runs on http://localhost:5000
```

---

## Backend API Endpoints

### Authentication
- `POST /api/coordinator/login` - Login with email/password
- `POST /api/coordinator/register` - Create new coordinator

### Students
- `GET /api/coordinator/students` - Get all students
- `POST /api/coordinator/students` - Add new student

### Companies
- `GET /api/coordinator/companies` - Get all companies
- `GET /api/coordinator/companies/registered` - Get registered companies only
- `GET /api/coordinator/companies/registering` - Get pending approval companies
- `POST /api/coordinator/companies` - Add new company
- `PATCH /api/coordinator/companies/:id/status` - Approve/Reject company
  ```json
  { "status": "registered" | "registering" }
  ```

### Jobs
- `GET /api/coordinator/jobs` - Get all jobs
- `POST /api/coordinator/jobs` - Create new job

### Applications (**NEW**)
- `GET /api/coordinator/applications` - Get all applications
- `POST /api/coordinator/applications` - Create application
- `PATCH /api/coordinator/applications/:id` - Update application status

### Placements
- `GET /api/coordinator/placements` - Get all placements
- `POST /api/coordinator/placements` - Assign student to placement

### Statistics
- `GET /api/coordinator/stats` - Get dashboard statistics

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables (.env or vite config)
The frontend automatically connects to `http://localhost:5000/api/coordinator`

### 3. Run Development Server
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Build for Production
```bash
npm run build
```

---

## Using the Placement Coordinator Dashboard

### Login
1. Enter your coordinator email and password
2. Click "Login"
3. Session is saved to browser, you'll stay logged in until logout

### Dashboard Tab
View key statistics:
- Total students
- Registered companies (✓ Approved)
- Registering companies (⏳ Pending Approval)
- Placed students
- Job openings
- Application statistics

### Companies Tab

#### Adding a New Company
1. Fill in company details:
   - Company Name (required)
   - Email (required, unique)
   - Website (optional)
   - Description (optional)
2. Click "Add Company"
3. Company appears in "Companies Registering" section

#### Approving a Company
1. View pending companies in "Companies Registering"
2. Click "Approve" button to register the company
3. Company moves to "Registered Companies" section
4. Company can now post jobs

#### Rejecting a Company
1. Click "Reject" button on pending company
2. Company stays in registering status until approved

### Students Tab
View all enrolled students with:
- Student name
- Email address
- Roll number
- CGPA

### Applications Tab (**NEW**)
Track all student applications:
- See which student applied to which company
- View job title and company name
- Check application status (Applied/Shortlisted/Selected/Rejected)
- See when student applied

### Jobs Tab
View all job openings:
- Job title and company
- Location and salary information
- Job description
- Application deadline

### Placements Tab
View final placements:
- Student name and job title
- Placement status (Placed/Pending/Rejected)
- Placement date for confirmed placements

---

## Workflow Example

### 1. Company Registration
1. Company submits registration details
2. Coordinator approves company in Companies tab → Approve button
3. Company status changes to "Registered"

### 2. Company Posts Jobs
1. Registered company creates job posting (via API or company portal)
2. Coordinator can see jobs in Jobs tab

### 3. Student Applications
1. Students apply for jobs (via Student portal)
2. Applications appear in Applications tab
3. Coordinator can track all applications

### 4. Final Placements
1. Coordinator assigns students to jobs after selection
2. Creates placement record with status "Placed"
3. View all placements in Placements tab

---

## Technical Details

### Security
- Passwords hashed with bcryptjs
- JWT tokens with 8-hour expiration
- Role-based access control
- Protected endpoints require coordinator role

### Database
- MongoDB Atlas cloud database
- Mongoose ODM
- Automatic timestamps on all records

### Frontend Framework
- React 19 with Hooks
- React Router for navigation
- Tailwind CSS for styling
- Vite for build tooling

---

## Troubleshooting

### Login Issues
- Verify backend is running on port 5000
- Check MongoDB connection in .env
- Ensure coordinator account exists in database

### Data Not Loading
- Check browser console for errors
- Verify JWT token is valid (8-hour expiration)
- Check backend server logs

### Company Approval Not Working
- Ensure you're logged in as coordinator
- Check network requests in browser DevTools
- Verify company ID is correct

### CORS Errors
- Backend has CORS enabled, should work by default
- Check frontend API_BASE URL matches backend

---

## Future Enhancements

- Email notifications for approvals
- Student application tracking by students
- Performance reports and analytics
- Bulk import of students and companies
- Resume upload and management
- Interview scheduling
- Offer letter generation
- Multiple placement coordinators with role hierarchy

---

## Support
For issues or questions, contact your development team or check application logs.
