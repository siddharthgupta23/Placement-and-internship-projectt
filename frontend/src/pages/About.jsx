import { Link } from "react-router-dom";
import {
  GraduationCap,
  Building2,
  Briefcase,
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  Target,
  Sparkles,
  BookOpen,
  FileCheck,
  Building,
  Mail,
} from "lucide-react";

const STATS = [
  {
    value: "150+",
    label: "Recruiting Partners",
    detail: "Top MNCs & startups hiring annually",
    icon: Building2,
    color: "text-blue-600 bg-blue-50",
  },
  {
    value: "85%+",
    label: "Placement Record",
    detail: "Consistent career conversion rate",
    icon: TrendingUp,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    value: "6.5 LPA",
    label: "Average Package",
    detail: "Competitive industry standards",
    icon: Award,
    color: "text-amber-600 bg-amber-50",
  },
  {
    value: "400+",
    label: "Internships Offered",
    detail: "Hands-on industry exposure",
    icon: Briefcase,
    color: "text-indigo-600 bg-indigo-50",
  },
];

const PILLARS = [
  {
    title: "Campus Recruitment Drives",
    description:
      "We orchestrate structured campus drives with premier multinational companies, IT leaders, and fast-growing organizations for full-time graduate roles.",
    icon: Building2,
    badge: "Recruitment",
    color: "border-blue-500",
  },
  {
    title: "Pre-Placement Training & Aptitude",
    description:
      "Comprehensive training covering technical problem solving, coding evaluations, group discussions, and mock HR interviews to build student confidence.",
    icon: BookOpen,
    badge: "Skill Development",
    color: "border-emerald-500",
  },
  {
    title: "Internship Programs",
    description:
      "Facilitating summer and semester-long internships that enable students to work on real-world projects, earn stipends, and secure pre-placement offers (PPOs).",
    icon: Sparkles,
    badge: "Corporate Exposure",
    color: "border-indigo-500",
  },
  {
    title: "Corporate & Alumni Mentorship",
    description:
      "Bridging the industry-academia gap through guest lectures, executive webinars, and one-on-one mentorship sessions with accomplished alumni.",
    icon: Users,
    badge: "Industry Connect",
    color: "border-amber-500",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Student Sign-In & Profile",
    description:
      "Log in with your college credentials, update verified academic scores, and upload your latest resume.",
    icon: GraduationCap,
  },
  {
    step: "02",
    title: "Discover & Apply",
    description:
      "Browse verified company openings, check role criteria and CTC details, and submit applications with a single click.",
    icon: Target,
  },
  {
    step: "03",
    title: "Assessments & Interviews",
    description:
      "Participate in online MCQ evaluations, coding rounds, and track shortlisting announcements in real time.",
    icon: FileCheck,
  },
  {
    step: "04",
    title: "Offer & Onboarding",
    description:
      "Receive official letter of intent (LOI), complete joining formalities, and embark on your corporate journey.",
    icon: Award,
  },
];

const RECRUITERS = [
  "Tata Consultancy Services",
  "Infosys",
  "Deloitte",
  "Wipro",
  "Amazon",
  "Paytm",
  "Cognizant",
  "HCL Technologies",
  "Accenture",
  "Tech Mahindra",
  "Lenskart",
  "Nagarro",
];

export default function About() {
  return (
    <div className="w-full bg-slate-50/40 pb-20 font-sans text-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-blue-100/80 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50/70 px-4 pb-16 pt-9 text-slate-800 sm:px-6 sm:pb-20 sm:pt-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl text-center sm:text-left">
          <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
            <GraduationCap size={15} />
            <span>JIMS Rohini • Career &amp; Internship Center</span>
          </div>

          <h1 className="text-2xl font-extrabold leading-snug tracking-tight text-blue-950 sm:text-3xl md:text-4xl">
            Bridging Academic Excellence with Professional Careers
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            The Training &amp; Placement Office (TPO) at Jagan Institute of Management Studies is dedicated to empowering students with career-defining placement and internship opportunities across leading industries.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Access Placement Portal
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-50"
            >
              Contact TPO Desk
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Highlight Cards (overlapping hero) */}
      <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-blue-950 sm:text-4xl">
                      {s.value}
                    </span>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}
                    >
                      <Icon size={22} />
                    </div>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-800">
                    {s.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {s.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Functions & Pillars */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
            Our Initiatives
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            What the Placement Cell Does
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            From skill preparation and mock interviews to multi-stage recruitment drives, our placement cell operates as an active career facilitator throughout the academic year.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className={`relative flex flex-col justify-between rounded-2xl border border-slate-200 border-t-[5px] ${p.color} bg-white p-7 shadow-sm transition hover:shadow-md`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon size={24} />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {p.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <CheckCircle2 size={15} />
                  <span>Integrated with Student Portal</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow: How It Works */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="text-center">
            <span className="inline-block rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700">
              Campus Hiring Lifecycle
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              How the Placement Process Works
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              A transparent, 4-step streamlined roadmap guiding students from enrollment to offer acceptance.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="relative flex flex-col rounded-2xl border border-slate-100 bg-slate-50/70 p-6 transition hover:bg-white hover:shadow-md hover:border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-blue-600">
                      {s.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/60 text-blue-700">
                      <Icon size={20} />
                    </div>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Prominent Recruiting Partners */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700">
            Corporate Alliances
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Our Regular Recruiters
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Esteemed companies that actively recruit JIMS graduates for internship and full-time positions.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {RECRUITERS.map((r) => (
            <div
              key={r}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-900"
            >
              <Building size={14} className="text-blue-600" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-sky-50 to-indigo-50/70 px-8 py-12 text-center text-slate-800 shadow-sm sm:px-12 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_70%)]" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl md:text-4xl">
              Are You a Recruiter or Student?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Join hands with the JIMS Placement Cell. Recruit qualified candidates or start exploring openings tailored to your skillset.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/company-signup"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Register as a Company
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-6 py-3 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-50"
              >
                <Mail size={16} />
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}