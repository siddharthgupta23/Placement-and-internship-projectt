import { useState } from "react";

const JOBS = [
  { id: 1, title: "Software Developer", company: "TechNova Solutions", type: "Full-time", location: "Noida", pay: "6 LPA", course: "BCA / MCA" },
  { id: 2, title: "Marketing Intern", company: "BrightEdge Media", type: "Internship", location: "Delhi", pay: "₹10,000 / month", course: "BBA / MBA" },
  { id: 3, title: "Business Analyst", company: "FinCore Consulting", type: "Full-time", location: "Gurugram", pay: "7 LPA", course: "BBA / MBA" },
  { id: 4, title: "Web Development Intern", company: "PixelWorks", type: "Internship", location: "Remote", pay: "₹8,000 / month", course: "BCA / B.Tech" },
];

const FILTERS = ["All", "Full-time", "Internship"];

export default function Opportunities() {
  const [filter, setFilter] = useState("All");
  const [applied, setApplied] = useState([]);

  const list = filter === "All" ? JOBS : JOBS.filter((j) => j.type === filter);
  const apply = (id) => setApplied((a) => (a.includes(id) ? a : [...a, id]));

  return (
    <div className="w-full font-sans text-ink">
      <section className="bg-soft px-5 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold text-navy md:text-4xl">Opportunities</h1>
          <p className="mb-8 mt-2 max-w-xl text-muted">
            Current openings from our recruiting partners. Pick one that fits your course and skills.
          </p>

          <div className="mb-7 flex flex-wrap gap-2.5" role="group" aria-label="Filter openings">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-full border-[1.5px] px-5 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  filter === f
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-ink hover:border-brand"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="py-6 text-muted">No openings in this category right now.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((j) => {
                const done = applied.includes(j.id);
                const intern = j.type === "Internship";
                return (
                  <article
                    key={j.id}
                    className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10"
                  >
                    <span
                      className={`self-start rounded-full px-3 py-0.5 text-xs font-semibold ${
                        intern ? "bg-[#fff1dc] text-[#a55b00]" : "bg-[#e5eefc] text-brand"
                      }`}
                    >
                      {j.type}
                    </span>
                    <h3 className="text-lg font-semibold">{j.title}</h3>
                    <div className="text-muted">{j.company}</div>

                    <dl className="mb-4 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted">Location</dt><dd>{j.location}</dd>
                      <dt className="text-muted">Package</dt><dd>{j.pay}</dd>
                      <dt className="text-muted">Eligible</dt><dd>{j.course}</dd>
                    </dl>

                    <button
                      type="button"
                      disabled={done}
                      onClick={() => apply(j.id)}
                      className="mt-auto rounded-lg border-[1.5px] border-brand bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-default disabled:border-[#0a7a3d] disabled:bg-[#0a7a3d]"
                    >
                      {done ? "Applied ✓" : "Apply now"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}



