// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from './context/AuthContext';

// import Home from './pages/Home';
// import Login from './pages/Login';
// import CompanySignup from './pages/CompanySignup';
// import StudentDashboard from './pages/StudentDashboard';
// import CompanyDashboard from './pages/CompanyDashboard';
// import AdminDashboard from './pages/AdminDashboard';
// import SuperAdminDashboard from './pages/SuperAdminDashboard';
// import JobListings from './pages/JobListings';
// import Navbar from './components/Navbar';
// import { getDashboardPath } from './utils/rolePaths';
// import { useEffect } from 'react';

// function AppContent() {
//   const { user, loading } = useAuth();
//   const location = useLocation();

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       alert("Session expired");
//       window.location.href = "/login";
//     }, 24 * 60 * 60 * 1000);

//     return () => clearTimeout(timer); // cleanup
//   }, []);

//   if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-sans">Loading...</div>;

//   // StudentDashboard provides its own full-screen responsive sidebar & top header
//   const isDedicatedWorkspace = location.pathname === '/student-dashboard';

//   return (
//     <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
//       {!isDedicatedWorkspace && <Navbar />}
//       <main className={isDedicatedWorkspace ? 'w-full' : 'container mx-auto px-4 py-8'}>
//         <Routes>
//           <Route path="/" element={!user ? <Home /> : <Navigate to={getDashboardPath(user.role)} />} />
//           <Route path="/login" element={!user ? <Login /> : <Navigate to={getDashboardPath(user.role)} />} />
//           <Route path="/company-signup" element={!user ? <CompanySignup /> : <Navigate to={getDashboardPath(user.role)} />} />

//           <Route path="/student-dashboard" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/login" />} />
//           <Route path="/jobs" element={user?.role === 'student' ? <JobListings /> : <Navigate to="/login" />} />

//           <Route path="/company-dashboard" element={user?.role === 'company' ? <CompanyDashboard /> : <Navigate to="/login" />} />

//           <Route path="/admin-dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
//           <Route path="/super-admin-dashboard" element={user?.role === 'super_admin' ? <SuperAdminDashboard /> : <Navigate to="/login" />} />

//           <Route path="*" element={<Navigate to="/" />} />
//         </Routes>
//       </main>
//     </div>
//   );
// }

// function App() {
//   return (
//     <Router>
//       <AppContent />
//     </Router>
//   );
// }

// export default App;



import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';

import Home from './pages/Home';
import Login from './pages/Login';
import CompanySignup from './pages/CompanySignup';

import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import JobListings from './pages/JobListings';
// import Opportunities from './pages/Opportunities';
import About from './pages/About';
import Contact from './pages/Contact';

import Navbar from './components/Navbar';
import { getDashboardPath } from './utils/rolePaths';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isDedicatedWorkspace = location.pathname === '/student-dashboard';

  useEffect(() => {
    const timer = setTimeout(() => {
      alert('Session expired');
      window.location.href = '/login';
    }, 24 * 60 * 60 * 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar />

      <main className={isDedicatedWorkspace ? "w-full" : "container mx-auto px-4 py-8"}>
        <Routes>
            {/* Homepage */}
            <Route
              path="/"
              element={
                !user ? (
                  <Home />
                ) : (
                  <Navigate to={getDashboardPath(user.role)} replace />
                )
              }
            />
            {/* <Route path="/opportunities" element={<Opportunities />} /> */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Role-specific login pages */}
            <Route
              path="/login"
              element={
                !user ? (
                  <Login />
                ) : (
                  <Navigate to={getDashboardPath(user.role)} replace />
                )
              }
            />


            <Route
              path="/student-login"
              element={
                !user ? (
                  <Login />
                ) : (
                  <Navigate to={getDashboardPath(user.role)} replace />
                )
              }
            />

            <Route
              path="/company-login"
              element={
                !user ? (
                  <Login />
                ) : (
                  <Navigate to={getDashboardPath(user.role)} replace />
                )
              }
            />

            <Route
              path="/admin-login"
              element={
                !user ? (
                  <Login />
                ) : (
                  <Navigate to={getDashboardPath(user.role)} replace />
                )
              }
            />

            <Route
              path="/super-admin-login"
              element={
                !user ? (
                  <Login />
                ) : (
                  <Navigate to={getDashboardPath(user.role)} replace />
                )
              }
            />

            {/* Company registration */}
            <Route
              path="/company-signup"
              element={
                !user ? (
                  <CompanySignup />
                ) : (
                  <Navigate to={getDashboardPath(user.role)} replace />
                )
              }
            />

            {/* Student routes */}
            <Route
              path="/student-dashboard"
              element={
                user?.role === 'student' ? (
                  <StudentDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/jobs"
              element={
                user?.role === 'student' ? (
                  <JobListings />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Company dashboard */}
            <Route
              path="/company-dashboard"
              element={
                user?.role === 'company' ? (
                  <CompanyDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Admin dashboard */}
            <Route
              path="/admin-dashboard"
              element={
                user?.role === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Super Admin dashboard */}
            <Route
              path="/super-admin-dashboard"
              element={
                user?.role === 'super_admin' ? (
                  <SuperAdminDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Unknown route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
