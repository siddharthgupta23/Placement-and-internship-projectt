import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  Building,
  GraduationCap,
  MessageSquare,
  Sparkles,
} from "lucide-react";

const TOPICS = [
  { id: "Placement query", label: "Placement Drive", icon: GraduationCap },
  { id: "Internship query", label: "Internship Query", icon: Sparkles },
  { id: "Recruiter / company", label: "Corporate Partnership", icon: Building },
  { id: "Portal login issue", label: "Technical Support", icon: HelpCircle },
];

const FAQS = [
  {
    q: "How soon does the Placement Cell respond to inquiries?",
    a: "Our placement coordinators review inquiries daily and respond within 1 to 2 business days during college working hours.",
  },
  {
    q: "I am a recruiter. How can I schedule a campus drive or workshop?",
    a: "Select 'Corporate Partnership' in the form above or email placement@jimsindia.org with your company profile and job description. Our TPO team will connect with you promptly.",
  },
  {
    q: "I forgot my Student Portal credentials or cannot sign in. What should I do?",
    a: "Choose 'Technical Support' in the form and provide your College Roll Number / Enrollment ID in the message so our admin team can verify and reset your access.",
  },
  {
    q: "Can students visit the Placement Office in person?",
    a: "Yes! Students can visit the Career & Internship Center on the Ground Floor, Block A, JIMS Rohini Sector-5 campus between 10:00 AM and 4:30 PM, Monday through Friday.",
  },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  topic: "Placement query",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleTopicSelect = (topicId) => {
    setForm((prev) => ({ ...prev, topic: topicId }));
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Please enter your full name.";
    if (!form.email.trim()) {
      err.email = "Email address is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      err.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) {
      err.message = "Please write your query or message.";
    } else if (form.message.trim().length < 15) {
      err.message = "Message must be at least 15 characters long.";
    }
    return err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    // Simulate async submission and ticket generation
    setTimeout(() => {
      const generatedTicket = `JIMS-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedTicket);
      setLoading(false);
      setSent(true);
      setForm(EMPTY_FORM);
    }, 700);
  };

  const resetForm = () => {
    setSent(false);
    setTicketId("");
    setErrors({});
  };

  return (
    <div className="w-full bg-slate-50/50 pb-20 font-sans text-slate-800">
      {/* Header Banner */}
      <section className="relative overflow-hidden border-b border-blue-100/80 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50/70 px-5 py-10 text-slate-800 sm:px-8 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            JIMS Rohini • Career &amp; Internship Center
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl md:text-4xl">
            We&apos;re Here to Help You
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Connect with the Training &amp; Placement Office (TPO) for queries regarding campus drives, corporate partnerships, and student placement assistance.
          </p>
        </div>
      </section>

      {/* Main Grid: Info + Form */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Direct Contact Info & Quick Cards (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Placement Cell Desk
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Reach out to us directly or visit our office during working hours.
              </p>
            </div>

            {/* Contact Details Card */}
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Address */}
              <div className="flex items-start gap-4 pb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <MapPin size={22} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Campus Address
                  </span>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-slate-800">
                    Jagan Institute of Management Studies (JIMS)
                    <br />
                    3, Institutional Area, Sector-5, Rohini,
                    <br />
                    New Delhi – 110085
                  </p>
                  <a
                    href="https://maps.google.com/?q=JIMS+Sector+5+Rohini+Delhi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View on Google Maps
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <Mail size={22} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Official Email
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <a
                      href="mailto:placement@jimsindia.org"
                      className="text-sm font-semibold text-slate-800 hover:text-blue-600"
                    >
                      placement@jimsindia.org
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("placement@jimsindia.org", "email")}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      title="Copy email"
                    >
                      {copiedKey === "email" ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    For student queries &amp; recruiter inquiries
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Phone size={22} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Helpline Numbers
                  </span>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <a
                        href="tel:01145184000"
                        className="text-sm font-semibold text-slate-800 hover:text-blue-600"
                      >
                        +91 (011) 45184000 / 100
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("01145184000", "phone")}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        {copiedKey === "phone" ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Reception &amp; Placement Coordination
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-4 pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Clock size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Working Hours
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active Office
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    Monday to Friday: 9:30 AM – 5:00 PM
                  </p>
                  <p className="text-xs text-slate-500">
                    Closed on Sundays &amp; Gazetted Holidays
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Assistance Callout */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-blue-950">
                <Sparkles size={16} className="text-blue-600" />
                Need Immediate Help with Campus Drives?
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Registered students can check scheduled interviews and test updates directly from the Student Dashboard.
              </p>
            </div>
          </div>

          {/* Right Column: User-Friendly Interactive Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {sent ? (
                /* Success State */
                <div className="py-8 text-center animate-fade-in">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-slate-900">
                    Message Received!
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                    Thank you for reaching out. Your query has been logged under reference ticket:
                  </p>
                  <div className="mx-auto mt-3 inline-block rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm font-mono font-bold text-emerald-800">
                    {ticketId}
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    A placement coordinator will review your request and get back to your provided email address shortly.
                  </p>
                  <div className="mt-7">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Send a Message
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Fill out the form below and we will route your inquiry to the relevant coordinator.
                    </p>
                  </div>

                  {/* Topic Selector Pills */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Query Category
                    </label>
                    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {TOPICS.map((t) => {
                        const Icon = t.icon;
                        const isSelected = form.topic === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleTopicSelect(t.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/70 font-semibold text-blue-800 shadow-sm ring-1 ring-blue-600"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <Icon
                              size={18}
                              className={isSelected ? "text-blue-600" : "text-slate-400"}
                            />
                            <span className="text-xs">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name and Email Grid */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                      >
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={form.name}
                        onChange={handleChange}
                        autoComplete="name"
                        className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                          errors.name
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                            : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                          <AlertCircle size={13} />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                      >
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                          errors.email
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                            : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                          <AlertCircle size={13} />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Optional Phone / Student ID */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                    >
                      Phone Number / Student Roll No. <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      placeholder="e.g. +91 98765 43210 or Roll No. 021142..."
                      value={form.phone}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="message"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                      >
                        Your Query or Message <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {form.message.length} chars (min 15)
                      </span>
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder="Please describe your query in detail so we can assist you better..."
                      value={form.message}
                      onChange={handleChange}
                      className={`mt-1.5 w-full resize-y rounded-xl border bg-white p-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                        errors.message
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                          : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                      }`}
                    />
                    {errors.message && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                        <AlertCircle size={13} />
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">
                      We respect your privacy. No spam.
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ Section) */}
      <section className="mx-auto mt-16 max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
            Common Inquiries
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick answers to the questions students and recruiters ask most frequently.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left font-semibold text-slate-800 transition hover:text-blue-700"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3.5 sm:px-5 sm:py-4 text-sm leading-relaxed text-slate-600">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}