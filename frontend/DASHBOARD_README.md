# Placement Portal - Student & Company Dashboard

A modern, mobile-responsive placement and internship management platform built with React, React Router, and Tailwind CSS.

## 📋 Features

### 🎓 Student Dashboard
- **Browse Placements**: View full-time job opportunities with detailed information
- **Explore Internships**: Find internship programs across various companies
- **Advanced Filtering**: Filter opportunities by:
  - Company name
  - Location
  - Salary range
- **Job Details**: Each listing shows:
  - Company information
  - Position & description
  - Salary package
  - Required technologies
  - Requirements
  - Post date & application deadline
- **Apply & Save**: Quick apply or save jobs for later
- **Mobile Responsive**: Fully responsive card-based layout

### 🏢 Company Dashboard
- **Dashboard Overview**: View key statistics at a glance:
  - Number of active job postings
  - Total applications received
  - Average applicants per job
  - Company profile views
- **Manage Job Postings**: 
  - View all active job listings
  - Edit job details
  - View applicants
- **Detailed Job View**: Modal popup with comprehensive job information:
  - Full job description
  - Key responsibilities
  - Requirements
  - Technology stack
  - Benefits & perks
  - Application statistics
- **Filter & Search**: Search by position, location, and department
- **Mobile Responsive**: Adaptive layout for all screen sizes

### 🔗 Home Page
- Hero section with platform overview
- Navigation to both dashboards
- Features showcase
- Platform statistics
- Professional design with gradient backgrounds

## 🛠️ Tech Stack

- **Frontend Framework**: React 19
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **CSS Processing**: PostCSS, Autoprefixer

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx                 # Landing page & navigation
│   │   ├── StudentDashboard.jsx     # Student job search dashboard
│   │   └── CompanyDashboard.jsx     # Company job management dashboard
│   ├── App.jsx                      # Main app with routing
│   ├── App.css                      # Global styles
│   ├── index.css                    # Tailwind CSS directives
│   ├── main.jsx                     # React entry point
│   └── assets/                      # Static assets
├── public/                           # Public assets
├── index.html                        # HTML entry point
├── package.json                      # Dependencies
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
└── eslint.config.js                 # ESLint configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Open in browser**:
```
http://localhost:5173/
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design Features

### Responsive Breakpoints
- **Mobile**: Single column layout (< 768px)
- **Tablet**: 2 columns (768px - 1024px)
- **Desktop**: 3+ columns (> 1024px)

### Color Scheme
- **Primary**: Blue (#2563eb, #1e40af)
- **Secondary**: Purple for company branding
- **Accents**: Green for benefits, Red for deadlines
- **Neutral**: Gray scale for text and backgrounds

### UI Components
- **Cards**: Job listings with hover effects
- **Modal Dialogs**: Detailed job information
- **Filters**: Search and filter functionality
- **Stats Cards**: Key metrics display
- **Buttons**: Call-to-action buttons with hover states
- **Forms**: Input fields and dropdowns

## 📱 Mobile Responsive Features

1. **Flexible Grid System**: Uses Tailwind's responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
2. **Adaptive Typography**: Text sizes scale with screen size
3. **Touch-Friendly**: Large buttons and easy-to-tap elements
4. **Sidebar to Hamburger**: Navigation adapts to screen size
5. **Modal Dialogs**: Full-screen modals on mobile, centered on desktop

## 🎯 Page Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Landing page with navigation |
| `/student-dashboard` | StudentDashboard | View placements & internships |
| `/company-dashboard` | CompanyDashboard | Manage job postings |

## 📊 Mock Data

### Student Dashboard
- **Placements**: 3 sample placements from Google, Microsoft, Amazon
- **Internships**: 3 sample internships from Accenture, TCS, Cognizant
- Each with realistic job details, requirements, and technology stacks

### Company Dashboard
- **Job Listings**: 3 detailed job postings
- **Statistics**: Key metrics and applicant counts
- Modal view with comprehensive job details

## 🔧 Customization

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.jsx`
3. Link from navigation

### Modifying Tailwind Theme
Edit `tailwind.config.js` to customize:
- Colors
- Typography
- Spacing
- Breakpoints

### Updating Mock Data
- Modify arrays in component state (StudentDashboard.jsx, CompanyDashboard.jsx)
- Replace with API calls when backend is ready

## 🔐 Future Enhancements

1. **Authentication**: Add login/signup functionality
2. **Backend Integration**: Connect to API for real job listings
3. **User Profiles**: Student profiles and company profile pages
4. **Application Tracking**: Track application status
5. **Messaging**: Chat between students and companies
6. **Notifications**: Real-time job alerts
7. **Admin Panel**: Manage platform content
8. **Payment Integration**: For premium features

## 📝 Usage Guide

### For Students
1. Navigate to "Student Dashboard"
2. View placements or internships using tabs
3. Use filters to search by company, location, or salary
4. Click "Apply" to submit application or "Save" for later
5. View detailed job information by clicking the job card

### For Companies
1. Navigate to "Company Dashboard"
2. View statistics and active job postings
3. Click "View Details" to see full job information
4. Click "View Applicants" to see applications
5. Click "Edit Job" to modify job details

## 📄 License

This project is part of a placement and internship portal system.

## 👥 Support

For issues or feature requests, please contact the development team.

---

**Status**: ✅ UI Complete - Ready for Backend Integration
**Version**: 1.0.0
**Last Updated**: February 2026
