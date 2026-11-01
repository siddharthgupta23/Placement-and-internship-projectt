// import { Link } from "react-router-dom";
// import {
//   GraduationCap,
//   Building2,
//   Briefcase,
//   ChevronRight,
//   TrendingUp,
//   Users,
//   BadgeCheck,
//   Award,
// } from "lucide-react";

// import Footer from "../components/footer";

// const Home = () => {
//   return (
//     <div className="bg-white min-h-screen flex flex-col">
//       <div className="flex-grow">
//         {/* Hero Section */}
//         <section className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white py-24 px-6">
//           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
//             {/* Left Content */}
//             <div className="space-y-7">
//               <p className="uppercase tracking-[6px] text-blue-100 font-extrabold text-sm md:text-base">
//                 JIMS Placement & Internship Portal
//               </p>

//               <div className="space-y-3">
//                 <p className="text-blue-100 text-2xl md:text-3xl font-semibold">
//                   Welcome to
//                 </p>

//                 <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
//                   Jagan Institute of
//                   <br />
//                   <span className="text-blue-100">Management Studies</span>
//                 </h1>
//               </div>

//               <p className="text-lg md:text-xl text-blue-100 leading-9 max-w-2xl">
//                 A dedicated placement and internship portal for JIMS students to
//                 explore opportunities, apply for jobs and internships, and stay
//                 connected with recruiters and campus placement activities.
//               </p>

//               <div className="flex flex-col sm:flex-row gap-4 pt-2">
//                 <Link
//                   to="/login"
//                   className="px-8 py-4 bg-white text-blue-900 font-semibold rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-2 shadow-lg"
//                 >
//                   Login <ChevronRight className="w-4 h-4" />
//                 </Link>

//                 <Link
//                   to="/company-signup"
//                   className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-900 transition font-semibold flex items-center justify-center shadow-lg"
//                 >
//                   Registered Company
//                 </Link>
//               </div>
//             </div>

//             {/* Right Premium Section */}
//             <div className="flex justify-center lg:justify-end">
//               <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xl border border-blue-100">
//                 <h2 className="text-3xl font-bold text-blue-950 mb-3 text-center">
//                   Placement Insights
//                 </h2>

//                 <p className="text-gray-600 text-center leading-7 mb-8">
//                   Explore the impact of our placement cell through recruiter
//                   engagement, student success, and internship opportunities.
//                 </p>

//                 <div className="grid grid-cols-2 gap-4 mb-8">
//                   <div className="bg-blue-50 rounded-2xl p-5 text-center shadow-sm">
//                     <TrendingUp className="w-8 h-8 text-blue-900 mx-auto mb-3" />
//                     <h3 className="text-2xl font-extrabold text-blue-950">120+</h3>
//                     <p className="text-sm text-gray-600 mt-1">Partner Companies</p>
//                   </div>

//                   <div className="bg-blue-50 rounded-2xl p-5 text-center shadow-sm">
//                     <Users className="w-8 h-8 text-blue-900 mx-auto mb-3" />
//                     <h3 className="text-2xl font-extrabold text-blue-950">500+</h3>
//                     <p className="text-sm text-gray-600 mt-1">Students Placed</p>
//                   </div>

//                   <div className="bg-blue-50 rounded-2xl p-5 text-center shadow-sm">
//                     <Briefcase className="w-8 h-8 text-blue-900 mx-auto mb-3" />
//                     <h3 className="text-2xl font-extrabold text-blue-950">300+</h3>
//                     <p className="text-sm text-gray-600 mt-1">Internship Roles</p>
//                   </div>

//                   <div className="bg-blue-50 rounded-2xl p-5 text-center shadow-sm">
//                     <BadgeCheck className="w-8 h-8 text-blue-900 mx-auto mb-3" />
//                     <h3 className="text-2xl font-extrabold text-blue-950">50+</h3>
//                     <p className="text-sm text-gray-600 mt-1">Active Recruiters</p>
//                   </div>
//                 </div>

//                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
//                   <h3 className="text-lg font-bold text-blue-950 mb-4 text-center">
//                     Top Hiring Recruiters
//                   </h3>

//                   <div className="grid grid-cols-2 gap-3 text-center">
//                     <div className="bg-white py-3 rounded-xl border border-slate-200 font-medium text-slate-700">
//                       TCS
//                     </div>
//                     <div className="bg-white py-3 rounded-xl border border-slate-200 font-medium text-slate-700">
//                       Infosys
//                     </div>
//                     <div className="bg-white py-3 rounded-xl border border-slate-200 font-medium text-slate-700">
//                       Wipro
//                     </div>
//                     <div className="bg-white py-3 rounded-xl border border-slate-200 font-medium text-slate-700">
//                       HCL
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Welcome Section */}
//         <section className="py-20 px-6 bg-white">
//           <div className="max-w-6xl mx-auto text-center">
//             <h2 className="text-4xl font-bold text-blue-950 mb-4">
//               Welcome to JIMS Placement Cell
//             </h2>
//             <div className="w-24 h-1 bg-blue-800 mx-auto mb-6 rounded"></div>
//             <p className="text-gray-700 text-lg leading-8 max-w-4xl mx-auto">
//               This portal is designed to support JIMS students in finding the
//               right internships and job opportunities. Students can manage their
//               profiles, upload resumes, track applications, and stay informed
//               about company visits and placement drives.
//             </p>
//           </div>
//         </section>

//         {/* Features Section */}
//         <section className="py-20 px-6 bg-slate-50">
//           <div className="max-w-6xl mx-auto">
//             <h2 className="text-4xl font-bold text-center text-blue-950 mb-4">
//               Portal Highlights
//             </h2>
//             <div className="w-24 h-1 bg-blue-800 mx-auto mb-14 rounded"></div>

//             <div className="grid md:grid-cols-3 gap-8">
//               <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-xl transition duration-300">
//                 <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mb-5 mx-auto">
//                   <GraduationCap className="w-8 h-8" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-blue-950 text-center mb-3">
//                   For Students
//                 </h3>
//                 <p className="text-gray-600 text-center leading-8">
//                   Create your profile, upload resume, and apply for available
//                   placement and internship opportunities easily.
//                 </p>
//               </div>

//               <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-xl transition duration-300">
//                 <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mb-5 mx-auto">
//                   <Building2 className="w-8 h-8" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-blue-950 text-center mb-3">
//                   For Recruiters
//                 </h3>
//                 <p className="text-gray-600 text-center leading-8">
//                   Registered companies can post job openings, internship roles,
//                   and connect directly with eligible JIMS students.
//                 </p>
//               </div>

//               <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-xl transition duration-300">
//                 <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mb-5 mx-auto">
//                   <Briefcase className="w-8 h-8" />
//                 </div>
//                 <h3 className="text-2xl font-bold text-blue-950 text-center mb-3">
//                   Career Opportunities
//                 </h3>
//                 <p className="text-gray-600 text-center leading-8">
//                   Stay updated with the latest recruitment drives, internships,
//                   and placement notices from the college placement cell.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Why Choose JIMS */}
//         <section className="py-20 px-6 bg-white">
//           <div className="max-w-6xl mx-auto">
//             <h2 className="text-4xl font-bold text-center text-blue-950 mb-4">
//               Why Choose JIMS Placement Portal
//             </h2>
//             <div className="w-24 h-1 bg-blue-800 mx-auto mb-14 rounded"></div>

//             <div className="grid md:grid-cols-3 gap-8">
//               <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
//                 <Award className="w-10 h-10 text-blue-900 mx-auto mb-4" />
//                 <h3 className="text-xl font-bold text-blue-950 mb-3">
//                   Trusted Institution
//                 </h3>
//                 <p className="text-gray-700 leading-7">
//                   JIMS provides a strong academic environment with structured
//                   support for placements and internships.
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
//                 <Users className="w-10 h-10 text-blue-900 mx-auto mb-4" />
//                 <h3 className="text-xl font-bold text-blue-950 mb-3">
//                   Strong Recruiter Network
//                 </h3>
//                 <p className="text-gray-700 leading-7">
//                   Connect with leading employers and discover career
//                   opportunities across multiple industries.
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
//                 <BadgeCheck className="w-10 h-10 text-blue-900 mx-auto mb-4" />
//                 <h3 className="text-xl font-bold text-blue-950 mb-3">
//                   Smooth Application Process
//                 </h3>
//                 <p className="text-gray-700 leading-7">
//                   Easily manage profiles, resumes, company applications, and
//                   placement updates from one platform.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default Home;



import { Link } from "react-router-dom";
import {
  GraduationCap,
  Building2,
  UserRound,
  ShieldCheck,
  BriefcaseBusiness,
  FileText,
  Users,
  TrendingUp,
  MapPin,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

import Footer from "../components/footer";

const roles = [
  {
    title: "Student",
    description:
      "Find internships and placements that match your skills and goals.",
    icon: GraduationCap,
    color: "bg-blue-100 text-blue-700",
    to: "/student-login",
  },
  {
    title: "Company",
    description:
      "Post job openings and connect with talented candidates.",
    icon: Building2,
    color: "bg-emerald-100 text-emerald-700",
    to: "/company-login",
  },
  {
    title: "Admin",
    description:
      "Manage placement activities and keep portal information updated.",
    icon: UserRound,
    color: "bg-violet-100 text-violet-700",
    to: "/admin-login",
  },
  {
    title: "Super Admin",
    description:
      "Oversee portal users and manage platform access.",
    icon: ShieldCheck,
    color: "bg-amber-100 text-amber-700",
    to: "/super-admin-login",
  },
];

const opportunities = [
  {
    company: "TCS",
    companyName: "Tata Consultancy Services",
    role: "Software Developer (Intern)",
    type: "Internship",
    category: "IT / Software",
    qualification: "B.Tech / MCA",
    location: "Noida",
    logoStyle: "text-rose-600",
  },
  {
    company: "Infosys",
    companyName: "Infosys Limited",
    role: "Frontend Developer (Intern)",
    type: "Internship",
    category: "IT / Software",
    qualification: "B.Tech / MCA",
    location: "Bengaluru",
    logoStyle: "text-sky-700",
  },
  {
    company: "Wipro",
    companyName: "Wipro Limited",
    role: "Associate Consultant",
    type: "Placement",
    category: "IT / Software",
    qualification: "B.Tech / MCA",
    location: "Gurgaon",
    logoStyle: "text-indigo-700",
  },
];

const stats = [
  {
    value: "120+",
    label: "Partner Companies",
    icon: BriefcaseBusiness,
  },
  {
    value: "300+",
    label: "Opportunities",
    icon: FileText,
  },
  {
    value: "500+",
    label: "Students Placed",
    icon: Users,
  },
  {
    value: "85%",
    label: "Placement Record",
    icon: TrendingUp,
  },
];

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="overflow-hidden bg-gradient-to-r from-sky-50 via-blue-50 to-white">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 md:py-14 lg:grid-cols-2 lg:gap-12 lg:px-10">
            {/* Left Content */}
            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                <GraduationCap size={15} />
                <span>Your Career</span>
                <span className="text-blue-300">•</span>
                <span>Our Priority</span>
              </div>

              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-blue-950 sm:text-5xl">
                Placement &amp; Internship
                <span className="block text-blue-600">
                  Portal
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Explore placement and internship opportunities,
                connect with recruiters, and take the next step
                towards your career goals through the JIMS
                Placement Cell.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Explore Opportunities
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/company-signup"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
                >
                  Register a Company
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck
                    size={15}
                    className="text-blue-600"
                  />
                  JIMS Placement Cell
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Users
                    size={15}
                    className="text-blue-600"
                  />
                  Student-focused
                </span>
              </div>
            </div>

            {/* Second Career Illustration */}
           <div className="flex w-full items-center justify-center">
  <img
    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAjYrXLfJ1eGfI4NEzSRYmiIC552Zx_qiDLf07eIswHA&s=10"
    alt="College students preparing for their careers"
    className="block h-auto w-full max-w-xl rounded-2xl object-contain"
    loading="eager"
    onError={(e) => {
      console.error("Career image failed to load:", e.currentTarget.src);
    }}
  />
</div>
          </div>
        </section>

        {/* Role Selector */}
        <section className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:px-10">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-blue-950">
              I am a...
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Choose your role to get started
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {roles.map(
              ({ title, description, icon: Icon, color, to }) => (
                <Link
                  to={to}
                  key={title}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div
                    className={`mb-4 grid h-11 w-11 place-items-center rounded-full ${color}`}
                  >
                    <Icon size={23} />
                  </div>

                  <ArrowRight
                    size={16}
                    className="absolute right-4 top-1/2 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                  />

                  <h3 className="mb-1 pr-5 text-sm font-bold text-blue-950">
                    {title}
                  </h3>

                  <p className="max-w-[230px] text-xs leading-5 text-slate-500">
                    {description}
                  </p>
                </Link>
              )
            )}
          </div>
        </section>

        {/* Featured Opportunities */}
        <section className="bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:px-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-blue-950">
                  Featured Opportunities
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Explore roles from popular recruiters
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                View All
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {opportunities.map((job) => (
                <article
                  key={job.company}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div
                      className={`grid h-11 w-12 place-items-center rounded-xl bg-slate-50 text-sm font-extrabold ${job.logoStyle}`}
                    >
                      {job.company}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-blue-950">
                        {job.company}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {job.companyName}
                      </p>
                    </div>
                  </div>

                  <h4 className="mb-3 text-sm font-semibold text-slate-800">
                    {job.role}
                  </h4>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                        job.type === "Placement"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {job.type}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                      {job.category}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500">
                    <p className="flex items-center gap-2">
                      <GraduationCap
                        size={14}
                        className="text-slate-600"
                      />
                      {job.qualification}
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin
                        size={14}
                        className="text-slate-600"
                      />
                      Location: {job.location}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      View Details
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Statistics */}
        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-5 py-7 sm:px-8 md:grid-cols-4 lg:px-10">
          {stats.map(({ value, label, icon: Icon }, index) => (
            <div
              key={label}
              className={`flex items-center justify-center gap-3 ${
                index !== 3
                  ? "md:border-r md:border-slate-200"
                  : ""
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
                <Icon size={20} />
              </span>

              <span>
                <strong className="block text-base font-extrabold text-blue-700">
                  {value}
                </strong>
                <small className="mt-0.5 block text-[11px] text-slate-500">
                  {label}
                </small>
              </span>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;




