// import { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { LogIn, KeyRound, Mail, User as UserIcon } from 'lucide-react';
// import { useEffect } from 'react';

// const Login = () => {
//     const { login } = useAuth();
//     const navigate = useNavigate();
//     const [role, setRole] = useState('student');
//     const [idField, setIdField] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);

//     // Reset input fields whenever role changes or component mounts
//     useEffect(() => {
//         setIdField('');
//         setPassword('');
//         setError('');
//     }, [role]);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');
//         setLoading(true);
//         try {
//             const payload = { role, password };
//             if (role === 'student') payload.studentId = idField;
//             else payload.email = idField;
//             await login(payload);
//             // Clear credentials from state after successful login
//             setIdField('');
//             setPassword('');
//         } catch (err) {
//             setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 p-6">
//             <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100 animate-fade-in">
                
//                 {/* Header */}
//                 <div className="px-8 py-6 bg-gradient-to-r from-blue-800 to-indigo-900 text-white">
//                     <h2 className="text-2xl font-bold flex items-center gap-2">
//                         <LogIn className="w-6 h-6 text-blue-300" />
//                         Welcome Back
//                     </h2>
//                     <p className="mt-1 text-blue-200 text-sm">Sign in to your portal</p>
//                 </div>

//                 {/* Role Selector */}
//                 <div className="px-8 py-6">
//                     <div className="flex justify-between bg-blue-50 p-1 rounded-xl mb-6 shadow-inner flex flex-col md:flex-row  gap-4">
//                         {['student', 'company', 'admin', 'super_admin'].map((r) => (
//                             <button
//                                 key={r}
//                                 onClick={() => setRole(r)}
//                                 className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 capitalize ${
//                                     role === r
//                                         ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md scale-105'
//                                         : 'text-blue-700 hover:text-blue-900 hover:bg-blue-100'
//                                 }`}
//                             >
//                                 {r.replace('_', ' ')}
//                             </button>
//                         ))}
//                     </div>

//                     {/* Error Message */}
//                     {error && (
//                         <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-700 shadow-sm">
//                             {error}
//                         </div>
//                     )}

//                     {/* Form */}
//                     <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
//                         {/* ID / Email */}
//                         <div>
//                             <label className="block text-sm font-medium text-blue-800 mb-1">
//                                 {role === 'student' ? 'Student ID' : 'Email Address'}
//                             </label>
//                             <div className="relative">
//                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                     {role === 'student' ? (
//                                         <UserIcon className="h-5 w-5 text-blue-400" />
//                                     ) : (
//                                         <Mail className="h-5 w-5 text-blue-400" />
//                                     )}
//                                 </div>
//                                 <input
//                                     type={role === 'student' ? 'text' : 'email'}
//                                     required
//                                     autoComplete="off"
//                                     name={`login_id_${role}`}
//                                     className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-blue-300 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
//                                     placeholder={role === 'student' ? 'STU001' : 'example@domain.com'}
//                                     value={idField}
//                                     onChange={(e) => setIdField(e.target.value)}
//                                 />
//                             </div>
//                         </div>

//                         {/* Password */}
//                         <div>
//                             <label className="block text-sm font-medium text-blue-800 mb-1">Password</label>
//                             <div className="relative">
//                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                     <KeyRound className="h-5 w-5 text-blue-400" />
//                                 </div>
//                                 <input
//                                     type="password"
//                                     required
//                                     autoComplete="new-password"
//                                     name="user_password"
//                                     className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-blue-300 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
//                                     placeholder="••••••••"
//                                     value={password}
//                                     onChange={(e) => setPassword(e.target.value)}
//                                 />
//                             </div>
//                         </div>

//                         {/* Submit Button */}
//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
//                                 loading
//                                     ? 'bg-blue-400 cursor-not-allowed'
//                                     : 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:scale-105 active:scale-95'
//                             }`}
//                         >
//                             {loading ? 'Authenticating...' : 'Sign In'}
//                         </button>
//                     </form>

//                     {/* Demo Credentials */}
//                     <div className="mt-6 text-center text-sm text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-900 shadow-inner">
//                         <p className="font-semibold text-blue-800 mb-1">Demo Credentials</p>
//                         {role === 'student' && <p>ID: STU001 - Password: password123</p>}
//                         {role === 'admin' && <p>ID: admin@college.edu - Password: password123</p>}
//                         {role === 'super_admin' && <p>ID: superadmin@college.edu - Password: password123</p>}
//                         {role === 'company' && <p>ID: company1@corp.com - Password: password123</p>}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;




import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogIn,
  KeyRound,
  Mail,
  User as UserIcon,
  Building2,
  GraduationCap,
  ShieldCheck,
  Eye,
  EyeOff,
  BriefcaseBusiness,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";

const roleByPath = {
  "/student-login": "student",
  "/company-login": "company",
  "/admin-login": "admin",
  "/super-admin-login": "super_admin",
  "/login": "student",
};

const roleContent = {
  student: {
    name: "Student",
    heading: "Build Your Future With Us",
    description:
      "Explore internships and placements, connect with recruiters and take the next step towards your career goals.",
    subtitle: "Access your student account.",
    fieldLabel: "Student ID",
    placeholder: "Enter your Student ID",
    icon: GraduationCap,
    //src: "/images/Student.webp",
    //src:"/images/Student-HR-Leaders.png",
    //src: "/images/Student-Resume.png",
    //src: "/images/Student-Graduation.jpg",
    src: "/images/Student-Career-Guidance.png",
    footer: "New student?",
    footerLink: "Contact Placement Cell",
  },
  company: {
    name: "Company",
    heading: "Partner With Us",
    description:
      "Post job openings and connect with talented candidates from JIMS.",
    subtitle: "Access your company account.",
    fieldLabel: "Company Email",
    placeholder: "Enter your email address",
    icon: Building2,
   src: "/images/Company.jpg",
    footer: "New company?",
    footerLink: "Register Now",
  },
  admin: {
    name: "Admin",
    heading: "Manage & Create Opportunities",
    description:
      "Oversee placement activities and keep portal information updated.",
    subtitle: "Manage placement activities.",
    fieldLabel: "Admin Email",
    placeholder: "Enter your email address",
    icon: UserIcon,
    src: "/images/Admin-illustration.png",
    footer: "Authorized personnel only",
    footerLink: "",
  },
  super_admin: {
    name: "Super Admin",
    heading: "Secure Access",
    description:
      "Oversee portal users and manage platform access.",
    subtitle: "Access your super admin account.",
    fieldLabel: "Super Admin Email",
    placeholder: "Enter your email address",
    icon: ShieldCheck,
    src: "public/SuperAdmin-illustartion.png",
    footer: "Restricted access • Super admin only",
    footerLink: "",
  },
};

const demoCredentials = {
  student: ["STU001", "password123"],
  company: ["company1@corp.com", "password123"],
  admin: ["admin@college.edu", "password123"],
  super_admin: ["superadmin@college.edu", "password123"],
};

const Login = () => {
  const { login } = useAuth();
  const location = useLocation();

  const role = roleByPath[location.pathname] || "student";
  const content = roleContent[role];
  const RoleIcon = content.icon;
  const isStudent = role === "student";

  const [idField, setIdField] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setIdField("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        role,
        password,
      };

      if (isStudent) {
        payload.studentId = idField.trim();
      } else {
        payload.email = idField.trim();
      }

      await login(payload);

      setIdField("");
      setPassword("");

      // Keep your existing post-login redirect behavior.
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    
<main className="min-h-[calc(100vh-115px)] w-full bg-[#f3f8ff] px-4 py-5 sm:px-6 lg:px-10">
  <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">

        {/* LEFT SIDE: JIMS branding and illustration */}
         
<section className="relative flex min-h-[500px] flex-col overflow-hidden bg-transparent p-4 sm:p-8 lg:min-h-[650px]">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-100/70" />
          <div className="absolute -bottom-24 -left-14 h-64 w-64 rounded-full bg-cyan-100/50" />

          <div className="relative z-10">
            <div className="mb-2 flex items-center gap-2">
              {/* <div className="leading-none">
                <img
  src="/images/jims-logo.jpg"
  alt="JIMS Sector-5 Rohini"
  className="h-14 w-auto object-contain object-left"
/>
              </div> */}
            </div>

            <h1 className="text-xl font-extrabold tracking-tight text-[#174b91]">
              Placement &amp; Internship Portal
            </h1>
            <p className="mt-1 text-sm text-[#4e719a]">
              Your Career. Our Priority.
            </p>

            <div className="mt-6 max-w-xl">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-[#174b91]">
                {content.heading}
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-6 text-[#43678e]">
                {content.description}
              </p>
            </div>
          </div>

   <div className="relative z-10 mt-4 flex items-center justify-start pl-0">       
  <img
    src={content.src}
    alt={`${content.name} portal illustration`}
    className="h-64 w-full max-w-lg object-contain object-left sm:h-80 lg:h-[400px]"
    onError={(e) => {
      console.error("Image failed to load:", e.currentTarget.src);
    }}
  />
</div>
          <div className="relative z-10 mt-3 flex items-center gap-2 text-xs text-[#49729d]">
            <CheckCircle2 size={15} />
            Your journey to career success starts here.
          </div>
        </section>

        {/* RIGHT SIDE: Login form */}
        
<section className="flex items-center justify-center bg-transparent p-2 sm:p-4">

          <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#e5edf8] bg-white shadow-[0_12px_35px_rgba(41,91,145,0.12)]">

            <div className="border-b border-slate-100 px-6 pb-4 pt-6 text-center sm:px-8">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <RoleIcon size={27} strokeWidth={2} />
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-[#173e78]">
                {content.name} Login
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Welcome back! Please sign in to your{" "}
                {content.name.toLowerCase()} account.
              </p>
            </div>

            <div className="px-6 py-4 sm:px-8">
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="loginId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    {content.fieldLabel}
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      {isStudent ? (
                        <UserIcon size={17} />
                      ) : (
                        <Mail size={17} />
                      )}
                    </div>

                    <input
                      id="loginId"
                      name="loginId"
                      type={isStudent ? "text" : "email"}
                      autoComplete="username"
                      required
                      value={idField}
                      onChange={(e) => setIdField(e.target.value)}
                      placeholder={content.placeholder}
                      className="w-full rounded-lg border border-[#d6e4f5] bg-white py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="loginPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <KeyRound size={17} />
                    </div>

                    <input
                      id="loginPassword"
                      name="loginPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-[#d6e4f5] bg-white py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-blue-600"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end text-xs">
  <button
    type="button"
    onClick={() =>
      setError(
        "Please contact your portal administrator to reset your password."
      )
    }
    className="text-blue-600 hover:underline"
  >
    Forgot password?
  </button>
</div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1763d9] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d50bd] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <LogIn size={17} />}
                </button>
              </form>

              <div className="mt-5 text-center text-xs leading-5 text-slate-500">
                <BriefcaseBusiness
                  size={15}
                  className="mx-auto mb-1 text-slate-400"
                />

                {role === "company" ? (
                  <p>
                    New company?{" "}
                    <Link
                      to="/company-signup"
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Register Now
                    </Link>
                  </p>
                ) : role === "student" ? (
                  <p>
                    {content.footer}{" "}
                    <span className="font-medium text-blue-600">
                      {content.footerLink}
                    </span>
                  </p>
                ) : (
                  <p className="font-medium text-slate-500">
                    {content.footer}
                  </p>
                )}

                <p className="mt-3 text-[11px] text-slate-400">
                  JIMS Placement &amp; Internship Portal
                </p>
              </div>

              {/* Demo credentials for development */}
              <details className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-slate-600">
                <summary className="cursor-pointer font-semibold text-blue-800">
                  Demo Credentials
                </summary>
                <p className="mt-2">ID: {demoCredentials[role][0]}</p>
                <p>Password: {demoCredentials[role][1]}</p>
              </details>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
