// import { useState } from "react";

// const JOBS = [
//   { id: 1, title: "Software Developer", company: "TechNova Solutions", type: "Full-time", location: "Noida", pay: "6 LPA", course: "BCA / MCA" },
//   { id: 2, title: "Marketing Intern", company: "BrightEdge Media", type: "Internship", location: "Delhi", pay: "₹10,000 / month", course: "BBA / MBA" },
//   { id: 3, title: "Business Analyst", company: "FinCore Consulting", type: "Full-time", location: "Gurugram", pay: "7 LPA", course: "BBA / MBA" },
//   { id: 4, title: "Web Development Intern", company: "PixelWorks", type: "Internship", location: "Remote", pay: "₹8,000 / month", course: "BCA / B.Tech" },
// ];

// const FILTERS = ["All", "Full-time", "Internship"];

// export default function Opportunities() {
//   const [filter, setFilter] = useState("All");
//   const [applied, setApplied] = useState([]);

//   const list = filter === "All" ? JOBS : JOBS.filter((j) => j.type === filter);
//   const apply = (id) => setApplied((a) => (a.includes(id) ? a : [...a, id]));

//   return (
//     <div className="w-full font-sans text-ink">
//       <section className="bg-soft px-5 py-12 md:px-6 md:py-16">
//         <div className="mx-auto max-w-6xl">
//           <h1 className="text-3xl font-semibold text-navy md:text-4xl">Opportunities</h1>
//           <p className="mb-8 mt-2 max-w-xl text-muted">
//             Current openings from our recruiting partners. Pick one that fits your course and skills.
//           </p>

//           <div className="mb-7 flex flex-wrap gap-2.5" role="group" aria-label="Filter openings">
//             {FILTERS.map((f) => (
//               <button
//                 key={f}
//                 type="button"
//                 aria-pressed={filter === f}
//                 onClick={() => setFilter(f)}
//                 className={`rounded-full border-[1.5px] px-5 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
//                   filter === f
//                     ? "border-brand bg-brand text-white"
//                     : "border-line bg-white text-ink hover:border-brand"
//                 }`}
//               >
//                 {f}
//               </button>
//             ))}
//           </div>

//           {list.length === 0 ? (
//             <p className="py-6 text-muted">No openings in this category right now.</p>
//           ) : (
//             <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
//               {list.map((j) => {
//                 const done = applied.includes(j.id);
//                 const intern = j.type === "Internship";
//                 return (
//                   <article
//                     key={j.id}
//                     className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10"
//                   >
//                     <span
//                       className={`self-start rounded-full px-3 py-0.5 text-xs font-semibold ${
//                         intern ? "bg-[#fff1dc] text-[#a55b00]" : "bg-[#e5eefc] text-brand"
//                       }`}
//                     >
//                       {j.type}
//                     </span>
//                     <h3 className="text-lg font-semibold">{j.title}</h3>
//                     <div className="text-muted">{j.company}</div>

//                     <dl className="mb-4 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
//                       <dt className="text-muted">Location</dt><dd>{j.location}</dd>
//                       <dt className="text-muted">Package</dt><dd>{j.pay}</dd>
//                       <dt className="text-muted">Eligible</dt><dd>{j.course}</dd>
//                     </dl>

//                     <button
//                       type="button"
//                       disabled={done}
//                       onClick={() => apply(j.id)}
//                       className="mt-auto rounded-lg border-[1.5px] border-brand bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-default disabled:border-[#0a7a3d] disabled:bg-[#0a7a3d]"
//                     >
//                       {done ? "Applied ✓" : "Apply now"}
//                     </button>
//                   </article>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </section>
//     </div>
//   );
// }





import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Bookmark,
  SlidersHorizontal,
  RefreshCw,
  X,
  LockKeyhole,
  CalendarDays,
} from "lucide-react";

import api from "../api";
import { useAuth } from "../context/AuthContext";

const categories = [
  "All",
  "Internship",
  "Full-time",
  "Part-time",
  "Campus Drive",
];

const getJobType = (job) => {
  const type = (
    job.jobType ||
    job.employmentType ||
    job.type ||
    job.category ||
    ""
  ).toLowerCase();

  if (type.includes("intern")) return "Internship";
  if (type.includes("part")) return "Part-time";
  if (type.includes("drive")) return "Campus Drive";

  return "Full-time";
};

const getPostedDate = (date) => {
  if (!date) return "Recently posted";

  const days = Math.floor(
    (Date.now() - new Date(date).getTime()) / 86400000
  );

  if (Number.isNaN(days)) return "Recently posted";
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";

  return `${Math.floor(days / 7)} weeks ago`;
};

const Opportunities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [location, setLocation] = useState("All");

  const [selectedJob, setSelectedJob] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const [savedJobs, setSavedJobs] = useState([]);

  // Check student login
  const isStudent =
    user?.role?.toLowerCase() === "student";

  // Fetch jobs from existing backend
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/jobs");

      const jobData = Array.isArray(response.data)
        ? response.data
        : response.data?.jobs || [];

      setJobs(jobData);
    } catch (err) {
      console.error("Error fetching jobs:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load opportunities. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Active jobs only
  const activeJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.status?.toLowerCase() === "closed") {
        return false;
      }

      if (
        job.deadline &&
        new Date(job.deadline) < new Date()
      ) {
        return false;
      }

      return true;
    });
  }, [jobs]);

  // Available locations
  const locations = useMemo(() => {
    return [
      "All",
      ...new Set(
        activeJobs
          .map((job) => job.location)
          .filter(Boolean)
      ),
    ];
  }, [activeJobs]);

  // Search and filter
  const filteredJobs = useMemo(() => {
    return activeJobs.filter((job) => {
      const company =
        job.company?.name || "Recruiter Partner";

      const searchableText = [
        job.role,
        company,
        job.location,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        search.toLowerCase()
      );

      const matchesCategory =
        activeCategory === "All" ||
        getJobType(job) === activeCategory;

      const matchesLocation =
        location === "All" ||
        job.location === location;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLocation
      );
    });
  }, [activeJobs, search, activeCategory, location]);

  // Save job (temporary UI state)
  const toggleSaveJob = (id) => {
    if (!isStudent) {
      setShowLoginPopup(true);
      return;
    }

    setSavedJobs((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  // View job details
  const handleViewDetails = (job) => {
    if (!isStudent) {
      setShowLoginPopup(true);
      return;
    }

    setSelectedJob(job);
  };

  // Login navigation
  const handleLogin = () => {
    setShowLoginPopup(false);
    navigate("/login");
  };

  const handleRegister = () => {
    setShowLoginPopup(false);
    navigate("/student-register");
  };

  const formatSalary = (job) => {
    return (
      job.salary ||
      job.ctc?.total ||
      "Not specified"
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F8FF] pt-16 pb-12">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* PAGE HEADER */}
        <div className="mb-7">

          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
            <Briefcase size={15} />
            JIMS Career Opportunities
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#142D63]">
            Find Your Next Opportunity
          </h1>

          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Explore jobs, internships and campus placement
            opportunities from recruiting companies.
          </p>

        </div>

        {/* SEARCH SECTION */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">

          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">

            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs and companies..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === "All" ? "All Locations" : loc}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchJobs}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

          </div>
        </div>

        {/* CATEGORY FILTER */}
        <div className="flex flex-wrap items-center gap-2 mb-6">

          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold mr-2">
            <SlidersHorizontal size={17} />
            Filter:
          </div>

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeCategory === category
                  ? "bg-[#1D4ED8] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-700"
              }`}
            >
              {category}
            </button>
          ))}

        </div>

        {/* RESULTS HEADER */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#142D63]">
            Available Opportunities
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            {filteredJobs.length} opportunities found
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <RefreshCw className="animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-slate-500 text-sm">
              Loading opportunities...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 font-semibold mb-3">
              {error}
            </p>

            <button
              onClick={fetchJobs}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* JOB CARDS */}
        {!loading && !error && filteredJobs.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {filteredJobs.map((job) => {

              const companyName =
                job.company?.name || "Recruiter Partner";

              const companyLogo =
                job.company?.logo ||
                job.company?.logoUrl;

              return (
                <div
                  key={job._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition flex flex-col"
                >

                  {/* COMPANY INFORMATION */}
                  <div className="flex items-center justify-between gap-3 mb-5">

                    <div className="flex items-center gap-3 min-w-0">

                      {companyLogo ? (
                        <img
                          src={companyLogo}
                          alt={companyName}
                          className="w-12 h-12 object-contain rounded-xl border border-slate-100 p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg">
                          {companyName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {companyName}
                        </h3>

                        <p className="text-xs text-slate-400 mt-1">
                          {getPostedDate(
                            job.createdAt || job.postedAt
                          )}
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() => toggleSaveJob(job._id)}
                      aria-label="Save job"
                      className={`p-2 rounded-lg transition ${
                        savedJobs.includes(job._id)
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      <Bookmark
                        size={19}
                        fill={
                          savedJobs.includes(job._id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>

                  </div>

                  {/* JOB TITLE */}
                  <h3 className="text-lg font-bold text-[#142D63] mb-3">
                    {job.role || "Job Opportunity"}
                  </h3>

                  {/* JOB TYPE */}
                  <div className="mb-4">
                    <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      {getJobType(job)}
                    </span>
                  </div>

                  {/* PUBLIC INFORMATION ONLY */}
                  <div className="space-y-3 text-sm text-slate-600 mb-6">

                    <p className="flex items-center gap-2">
                      <MapPin size={17} className="text-blue-600" />
                      {job.location || "Location not specified"}
                    </p>

                    <p className="flex items-center gap-2">
                      <Briefcase size={17} className="text-blue-600" />
                      {getJobType(job)}
                    </p>

                  </div>

                  {/* LOCKED DETAILS MESSAGE */}
                  <div className="mt-auto pt-4 border-t border-slate-100">

                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                      <LockKeyhole size={14} />
                      Sign in to view complete job details
                    </div>

                    <button
                      onClick={() => handleViewDetails(job)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1D4ED8] text-white text-sm font-semibold hover:bg-blue-800 transition"
                    >
                      View Details
                      <ArrowRight size={16} />
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* NO JOBS */}
        {!loading && !error && filteredJobs.length === 0 && (

          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">

            <Briefcase
              size={42}
              className="mx-auto text-slate-300 mb-4"
            />

            <h3 className="text-lg font-bold text-slate-800">
              No opportunities found
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Try changing your search or filters.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
                setLocation("All");
              }}
              className="mt-5 text-blue-600 font-semibold text-sm hover:underline"
            >
              Clear Filters
            </button>

          </div>
        )}

      </div>

      {/* LOGIN REQUIRED POPUP */}
      {showLoginPopup && (

        <div
          className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLoginPopup(false)}
        >

          <div
            className="bg-white rounded-2xl w-full max-w-md p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Close popup"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <LockKeyhole
                size={30}
                className="text-blue-700"
              />
            </div>

            <h2 className="text-2xl font-bold text-[#142D63] text-center">
              Sign In Required
            </h2>

            <p className="text-sm text-slate-500 text-center mt-3 leading-6">
              Unlock your career opportunities! Sign in to
              your student account to view complete job
              descriptions, eligibility criteria, salary
              details and application deadlines.
            </p>

            <button
              onClick={handleLogin}
              className="w-full mt-7 py-3 bg-[#1D4ED8] text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition"
            >
              Sign In to Continue
            </button>

            <button
              onClick={handleRegister}
              className="w-full mt-3 py-3 border border-blue-200 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition"
            >
              Register as a Student
            </button>

            <p className="text-xs text-slate-400 text-center mt-5">
              JIMS Placement & Internship Portal
            </p>

          </div>
        </div>
      )}

      {/* STUDENT JOB DETAILS MODAL */}
      {selectedJob && (

        <div
          className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4"
          onClick={() => setSelectedJob(null)}
        >

          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex justify-between items-center">

              <div>
                <p className="text-xs text-blue-600 font-semibold">
                  Opportunity Details
                </p>

                <h2 className="text-xl font-bold text-[#142D63] mt-1">
                  {selectedJob.role}
                </h2>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-lg hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={21} />
              </button>

            </div>

            <div className="p-6 space-y-5">

              <div>
                <p className="font-bold text-slate-800">
                  {selectedJob.company?.name || "Recruiter Partner"}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {selectedJob.location || "Location not specified"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500">
                    Salary / CTC
                  </p>

                  <p className="font-bold text-blue-700 mt-1">
                    ₹ {formatSalary(selectedJob)}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500">
                    Job Type
                  </p>

                  <p className="font-bold text-blue-700 mt-1">
                    {getJobType(selectedJob)}
                  </p>
                </div>

              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2">
                  Job Description
                </h3>

                <p className="text-sm text-slate-600 leading-6 whitespace-pre-line">
                  {selectedJob.description ||
                    "Description not available."}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2">
                  Required Skills
                </h3>

                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills?.length > 0 ? (
                    selectedJob.requiredSkills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Skills not specified.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2">
                  Eligibility
                </h3>

                <p className="text-sm text-slate-600">
                  {selectedJob.eligibility ||
                    "Eligibility details not specified."}
                </p>
              </div>

              {selectedJob.deadline && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <CalendarDays size={17} />

                  Application Deadline:{" "}
                  {new Date(selectedJob.deadline).toLocaleDateString(
                    "en-IN"
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedJob(null);
                  navigate("/student-dashboard");
                }}
                className="w-full py-3 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl font-semibold text-sm transition"
              >
                Go to Student Dashboard to Apply
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Opportunities;