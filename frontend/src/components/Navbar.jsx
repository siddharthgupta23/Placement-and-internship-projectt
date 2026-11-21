// import { useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { LogOut, Briefcase, LayoutDashboard, Menu, X } from 'lucide-react';
// import { getDashboardPath } from '../utils/rolePaths';
// import NotificationBell from './NotificationBell';

// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const location = useLocation();

//   const closeMenu = () => setMobileMenuOpen(false);

//   return (
//     <nav className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center min-h-[80px] md:min-h-[96px]">

//           {/* Left: Logo */}
//           <Link to="/" onClick={closeMenu} className="flex items-center gap-2 shrink-0 py-2">
//             <img
//               src="/jims-full-logo.png.png"
//               alt="JIMS Sector 5 Rohini Delhi"
//               className="h-16 md:h-20 w-auto object-contain"
//               onError={(e) => {
//                 e.currentTarget.style.display = 'none';
//               }}
//             />
//             <div className="flex flex-col">
//               <span className="font-bold text-slate-900 text-base md:text-lg tracking-tight">Placement Portal</span>
//               <span className="text-[11px] text-blue-600 font-medium hidden sm:inline">Career & Internship Center</span>
//             </div>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center space-x-3 text-sm font-medium">
//             {user ? (
//               <>
//                 {user.role === 'student' && (
//                   <>
//                     <NotificationBell />
//                     <Link
//                       to="/student-dashboard"
//                       className={`flex items-center px-3.5 py-2 rounded-xl transition ${
//                         location.pathname === '/student-dashboard'
//                           ? 'bg-blue-50 text-blue-700 font-semibold'
//                           : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
//                       }`}
//                     >
//                       <LayoutDashboard className="w-4 h-4 mr-2" />
//                       Dashboard
//                     </Link>

//                     <Link
//                       to="/jobs"
//                       className={`flex items-center px-3.5 py-2 rounded-xl transition ${
//                         location.pathname === '/jobs'
//                           ? 'bg-blue-50 text-blue-700 font-semibold'
//                           : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
//                       }`}
//                     >
//                       <Briefcase className="w-4 h-4 mr-2" />
//                       Explore Jobs
//                     </Link>
//                   </>
//                 )}

//                 {user.role === 'company' && (
//                   <Link
//                     to="/company-dashboard"
//                     className="flex items-center px-3.5 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
//                   >
//                     <LayoutDashboard className="w-4 h-4 mr-2" />
//                     Company Dashboard
//                   </Link>
//                 )}

//                 {user.role === 'admin' && (
//                   <Link
//                     to="/admin-dashboard"
//                     className="flex items-center px-3.5 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
//                   >
//                     <LayoutDashboard className="w-4 h-4 mr-2" />
//                     TPO Admin
//                   </Link>
//                 )}

//                 {user.role === 'super_admin' && (
//                   <Link
//                     to={getDashboardPath(user.role)}
//                     className="flex items-center px-3.5 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
//                   >
//                     <LayoutDashboard className="w-4 h-4 mr-2" />
//                     Super Admin
//                   </Link>
//                 )}

//                 <button
//                   onClick={logout}
//                   className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center px-4 py-2 rounded-xl font-medium text-sm transition"
//                 >
//                   <LogOut className="w-4 h-4 mr-2" />
//                   Logout
//                 </button>
//               </>
//             ) : (
//               <div className="flex items-center space-x-3">
//                 <Link
//                   to="/login"
//                   className="text-slate-700 hover:text-blue-600 px-4 py-2 text-sm font-semibold transition"
//                 >
//                   Sign In
//                 </Link>

//                 <Link
//                   to="/company-signup"
//                   className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white hover:from-blue-800 hover:to-indigo-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
//                 >
//                   For Recruiters
//                 </Link>
//               </div>
//             )}
//           </div>

//           {/* Mobile hamburger button */}
//           <div className="flex items-center md:hidden gap-2">
//             {user && user.role === 'student' && <NotificationBell />}
//             <button
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition focus:outline-none"
//               aria-label="Toggle Navigation Menu"
//             >
//               {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//             </button>
//           </div>

//         </div>
//       </div>

//       {/* Mobile Menu Dropdown Drawer */}
//       {mobileMenuOpen && (
//         <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fade-in">
//           {user ? (
//             <>
//               <div className="px-3 py-2 bg-slate-50 rounded-xl mb-2">
//                 <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Signed in as</p>
//                 <p className="text-sm font-bold text-slate-800 capitalize">{user.role.replace('_', ' ')}</p>
//               </div>

//               {user.role === 'student' && (
//                 <>
//                   <Link
//                     to="/student-dashboard"
//                     onClick={closeMenu}
//                     className="flex items-center px-3 py-2.5 rounded-xl text-slate-700 hover:bg-blue-50 font-medium"
//                   >
//                     <LayoutDashboard className="w-5 h-5 mr-3 text-blue-600" />
//                     Student Dashboard
//                   </Link>

//                   <Link
//                     to="/jobs"
//                     onClick={closeMenu}
//                     className="flex items-center px-3 py-2.5 rounded-xl text-slate-700 hover:bg-blue-50 font-medium"
//                   >
//                     <Briefcase className="w-5 h-5 mr-3 text-blue-600" />
//                     Explore Jobs
//                   </Link>
//                 </>
//               )}

//               {user.role === 'company' && (
//                 <Link
//                   to="/company-dashboard"
//                   onClick={closeMenu}
//                   className="flex items-center px-3 py-2.5 rounded-xl text-slate-700 hover:bg-blue-50 font-medium"
//                 >
//                   <LayoutDashboard className="w-5 h-5 mr-3 text-blue-600" />
//                   Company Dashboard
//                 </Link>
//               )}

//               {user.role === 'admin' && (
//                 <Link
//                   to="/admin-dashboard"
//                   onClick={closeMenu}
//                   className="flex items-center px-3 py-2.5 rounded-xl text-slate-700 hover:bg-blue-50 font-medium"
//                 >
//                   <LayoutDashboard className="w-5 h-5 mr-3 text-blue-600" />
//                   TPO Admin Dashboard
//                 </Link>
//               )}

//               {user.role === 'super_admin' && (
//                 <Link
//                   to={getDashboardPath(user.role)}
//                   onClick={closeMenu}
//                   className="flex items-center px-3 py-2.5 rounded-xl text-slate-700 hover:bg-blue-50 font-medium"
//                 >
//                   <LayoutDashboard className="w-5 h-5 mr-3 text-blue-600" />
//                   Super Admin Panel
//                 </Link>
//               )}

//               <button
//                 onClick={() => { closeMenu(); logout(); }}
//                 className="w-full mt-3 bg-red-50 text-red-600 flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-sm transition hover:bg-red-100"
//               >
//                 <LogOut className="w-4 h-4 mr-2" />
//                 Sign Out
//               </button>
//             </>
//           ) : (
//             <div className="space-y-2 pt-2">
//               <Link
//                 to="/login"
//                 onClick={closeMenu}
//                 className="w-full text-center block bg-slate-100 text-slate-800 py-3 rounded-xl font-semibold text-sm hover:bg-slate-200"
//               >
//                 Sign In
//               </Link>
//               <Link
//                 to="/company-signup"
//                 onClick={closeMenu}
//                 className="w-full text-center block bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-800 shadow-sm"
//               >
//                 Recruiter Registration
//               </Link>
//             </div>
//           )}
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Navbar;


// import { useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import {
//   LogOut,
//   Briefcase,
//   LayoutDashboard,
//   Menu,
//   X,
// } from 'lucide-react';
// import { getDashboardPath } from '../utils/rolePaths';
// import NotificationBell from './NotificationBell';

// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const location = useLocation();

//   const closeMenu = () => setMobileMenuOpen(false);

//   const publicLinks = [
//     { name: 'Home', to: '/' },
//     // { name: 'Opportunities', to: '/opportunities' },
//     { name: 'About Us', to: '/about' },
//     { name: 'Contact', to: '/contact' },
//   ];

//   const linkClass = (path) =>
//     `whitespace-nowrap transition-colors ${
//       location.pathname === path
//         ? 'font-semibold text-blue-700'
//         : 'text-slate-600 hover:text-blue-700'
//     }`;

//   return (
//     <>
//       <nav className="fixed top-0 left-0 right-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
//         <div className="w-full px-6 sm:px-8 lg:px-12">
//         <div className="flex min-h-[82px] w-full items-center justify-between gap-6">          
// {/* JIMS Logo and portal name */}
// <Link
//   to="/"
//   onClick={closeMenu}
//   className="flex shrink-0 items-center gap-3"
// >
//   <img
//     src="/images/jims-full-logo.png.png"
//     alt="JIMS Logo"
//     className="h-16 w-auto max-w-[170px] object-contain"
//   />

//   <div className="flex flex-col">
//     <span className="text-lg font-bold tracking-tight text-blue-950 sm:text-xl">
//       Placement Portal
//     </span>
//     <span className="text-xs text-slate-500 sm:text-sm">
//       Career &amp; Internship Center
//     </span>
//   </div>
// </Link>


//           {/* Desktop navigation */}
//           <div className=" ml-auto hidden items-center gap-5 lg:flex xl:gap-7">
//             {!user ? (
//               <>
//                 <div className="flex items-center gap-4 xl:gap-5">
//                   {publicLinks.map((item) => (
//                     <Link
//                       key={item.name}
//                       to={item.to}
//                       className={linkClass(item.to)}
//                     >
//                       {item.name}
//                     </Link>
//                   ))}
//                 </div>

//                 <div className="ml-1 flex items-center gap-3">
//                   <Link
//                     to="/login"
//                     className="inline-flex min-h-12 items-center justify-center rounded-lg border border-blue-700 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
//                   >
//                     Sign In
//                   </Link>

//                   <Link
//                     to="/company-signup"
//                     className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800"
//                   >
//                     For Recruiters
//                   </Link>
//                 </div>
//               </>
//             ) : (
//               <>
//                 {user.role === 'student' && (
//                   <>
//                     <NotificationBell />

//                     <Link
//                       to="/student-dashboard"
//                       className={`flex items-center gap-2 rounded-lg px-3 py-2 ${linkClass(
//                         '/student-dashboard'
//                       )}`}
//                     >
//                       <LayoutDashboard size={17} />
//                       Dashboard
//                     </Link>

//                     <Link
//                       to="/jobs"
//                       className={`flex items-center gap-2 rounded-lg px-3 py-2 ${linkClass(
//                         '/jobs'
//                       )}`}
//                     >
//                       <Briefcase size={17} />
//                       Explore Jobs
//                     </Link>
//                   </>
//                 )}

//                 {user.role === 'company' && (
//                   <Link
//                     to="/company-dashboard"
//                     className={`flex items-center gap-2 rounded-lg px-3 py-2 ${linkClass(
//                       '/company-dashboard'
//                     )}`}
//                   >
//                     <LayoutDashboard size={17} />
//                     Company Dashboard
//                   </Link>
//                 )}

//                 {user.role === 'admin' && (
//                   <Link
//                     to="/admin-dashboard"
//                     className={`flex items-center gap-2 rounded-lg px-3 py-2 ${linkClass(
//                       '/admin-dashboard'
//                     )}`}
//                   >
//                     <LayoutDashboard size={17} />
//                     TPO Admin
//                   </Link>
//                 )}

//                 {user.role === 'super_admin' && (
//                   <Link
//                     to={getDashboardPath(user.role)}
//                     className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
//                   >
//                     <LayoutDashboard size={17} />
//                     Super Admin
//                   </Link>
//                 )}

//                 <button
//                   onClick={logout}
//                   className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
//                 >
//                   <LogOut size={17} />
//                   Logout
//                 </button>
//               </>
//             )}
//           </div>

//           {/* Mobile controls */}
//           <div className="flex items-center gap-2 lg:hidden">
//             {user?.role === 'student' && <NotificationBell />}

//             <button
//               type="button"
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               className="rounded-lg p-2.5 text-slate-700 transition hover:bg-slate-100"
//               aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
//               aria-expanded={mobileMenuOpen}
//             >
//               {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile dropdown */}
//       {mobileMenuOpen && (
//         <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg lg:hidden">
//           {!user ? (
//             <div className="space-y-1">
//               {publicLinks.map((item) => (
//                 <Link
//                   key={item.name}
//                   to={item.to}
//                   onClick={closeMenu}
//                   className={`block rounded-lg px-4 py-3 text-sm ${linkClass(
//                     item.to
//                   )} hover:bg-blue-50`}
//                 >
//                   {item.name}
//                 </Link>
//               ))}

//               <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
//                 <Link
//                   to="/login"
//                   onClick={closeMenu}
//                   className="rounded-lg border border-blue-700 px-4 py-3 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
//                 >
//                   Sign In
//                 </Link>

//                 <Link
//                   to="/company-signup"
//                   onClick={closeMenu}
//                   className="rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
//                 >
//                   For Recruiters
//                 </Link>
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-2">
//               <div className="mb-3 rounded-lg bg-blue-50 px-4 py-3">
//                 <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
//                   Signed in as
//                 </p>
//                 <p className="mt-1 text-sm font-semibold capitalize text-blue-950">
//                   {user.role.replace('_', ' ')}
//                 </p>
//               </div>

//               {user.role === 'student' && (
//                 <>
//                   <Link
//                     to="/student-dashboard"
//                     onClick={closeMenu}
//                     className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
//                   >
//                     <LayoutDashboard size={19} className="text-blue-700" />
//                     Student Dashboard
//                   </Link>

//                   <Link
//                     to="/jobs"
//                     onClick={closeMenu}
//                     className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
//                   >
//                     <Briefcase size={19} className="text-blue-700" />
//                     Explore Jobs
//                   </Link>
//                 </>
//               )}

//               {user.role === 'company' && (
//                 <Link
//                   to="/company-dashboard"
//                   onClick={closeMenu}
//                   className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
//                 >
//                   <LayoutDashboard size={19} className="text-blue-700" />
//                   Company Dashboard
//                 </Link>
//               )}

//               {user.role === 'admin' && (
//                 <Link
//                   to="/admin-dashboard"
//                   onClick={closeMenu}
//                   className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
//                 >
//                   <LayoutDashboard size={19} className="text-blue-700" />
//                   TPO Admin Dashboard
//                 </Link>
//               )}

//               {user.role === 'super_admin' && (
//                 <Link
//                   to={getDashboardPath(user.role)}
//                   onClick={closeMenu}
//                   className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
//                 >
//                   <LayoutDashboard size={19} className="text-blue-700" />
//                   Super Admin Panel
//                 </Link>
//               )}

//               <button
//                 type="button"
//                 onClick={() => {
//                   closeMenu();
//                   logout();
//                 }}
//                 className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
//               >
//                 <LogOut size={18} />
//                 Logout
//               </button>
//             </div>
//           )}
//         </div>
//       )}
//     </nav>
//     <div className="h-[82px]" aria-hidden="true" />
//   </>
//   );
// };

// export default Navbar;



import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Briefcase,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { getDashboardPath } from '../utils/rolePaths';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMobileMenuOpen(false);

  const publicLinks = [
    { name: 'Home', to: '/' },
    { name: 'Opportunities', to: '/jobs' },
    { name: 'About Us', to: '/about' },
    { name: 'Contact', to: '/contact' },
  ];

  const linkClass = (path) =>
    `whitespace-nowrap transition-colors ${
      location.pathname === path
        ? 'font-semibold text-blue-700'
        : 'text-slate-600 hover:text-blue-700'
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="w-full px-6 sm:px-8 lg:px-12">
        <div className="flex min-h-[82px] w-full items-center justify-between gap-6">          
{/* JIMS Logo and portal name */}
<Link
  to="/"
  onClick={closeMenu}
  className="flex shrink-0 items-center gap-3"
>
  <img
    src="/images/jims-full-logo.png.png"
    alt="JIMS Logo"
    className="h-16 w-auto max-w-[170px] object-contain"
  />

  <div className="flex flex-col">
    <span className="text-lg font-bold tracking-tight text-blue-950 sm:text-xl">
      Placement Portal
    </span>
    <span className="text-xs text-slate-500 sm:text-sm">
      Career &amp; Internship Center
    </span>
  </div>
</Link>


          {/* Desktop navigation */}
          <div className=" ml-auto hidden items-center gap-5 lg:flex xl:gap-7">
            {!user ? (
              <>
                <div className="flex items-center gap-4 xl:gap-5">
                  {publicLinks.map((item) => (
                    <Link
                      key={item.name}
                      to={item.to}
                      className={linkClass(item.to)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div className="ml-1 flex items-center gap-3">
                  <Link
                    to="/login"
                    className="inline-flex min-h-12 items-center justify-center rounded-lg border border-blue-700 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/company-signup"
                    className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    For Recruiters
                  </Link>
                </div>
              </>
            ) : (
              <>
                {user.role === 'student' && (
                  <>
                    <NotificationBell />

                    <Link
                      to="/student-dashboard"
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${linkClass(
                        '/student-dashboard'
                      )}`}
                    >
                      <LayoutDashboard size={17} />
                      Dashboard
                    </Link>

                    <Link
                      to="/jobs"
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${linkClass(
                        '/jobs'
                      )}`}
                    >
                      <Briefcase size={17} />
                      Explore Jobs
                    </Link>
                  </>
                )}

                {user.role === 'company' && (
                  <Link
                    to="/company-dashboard"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${linkClass(
                      '/company-dashboard'
                    )}`}
                  >
                    <LayoutDashboard size={17} />
                    Company Dashboard
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link
                    to="/admin-dashboard"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${linkClass(
                      '/admin-dashboard'
                    )}`}
                  >
                    <LayoutDashboard size={17} />
                    TPO Admin
                  </Link>
                )}

                {user.role === 'super_admin' && (
                  <Link
                    to={getDashboardPath(user.role)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <LayoutDashboard size={17} />
                    Super Admin
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            {user?.role === 'student' && <NotificationBell />}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2.5 text-slate-700 transition hover:bg-slate-100"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg lg:hidden">
          {!user ? (
            <div className="space-y-1">
              {publicLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.to}
                  onClick={closeMenu}
                  className={`block rounded-lg px-4 py-3 text-sm ${linkClass(
                    item.to
                  )} hover:bg-blue-50`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-lg border border-blue-700 px-4 py-3 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Sign In
                </Link>

                <Link
                  to="/company-signup"
                  onClick={closeMenu}
                  className="rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  For Recruiters
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mb-3 rounded-lg bg-blue-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Signed in as
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-blue-950">
                  {user.role.replace('_', ' ')}
                </p>
              </div>

              {user.role === 'student' && (
                <>
                  <Link
                    to="/student-dashboard"
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
                  >
                    <LayoutDashboard size={19} className="text-blue-700" />
                    Student Dashboard
                  </Link>

                  <Link
                    to="/jobs"
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
                  >
                    <Briefcase size={19} className="text-blue-700" />
                    Explore Jobs
                  </Link>
                </>
              )}

              {user.role === 'company' && (
                <Link
                  to="/company-dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
                >
                  <LayoutDashboard size={19} className="text-blue-700" />
                  Company Dashboard
                </Link>
              )}

              {user.role === 'admin' && (
                <Link
                  to="/admin-dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
                >
                  <LayoutDashboard size={19} className="text-blue-700" />
                  TPO Admin Dashboard
                </Link>
              )}

              {user.role === 'super_admin' && (
                <Link
                  to={getDashboardPath(user.role)}
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50"
                >
                  <LayoutDashboard size={19} className="text-blue-700" />
                  Super Admin Panel
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  logout();
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;