import { Mail, Phone, Globe, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">

        {/* LEFT - COLLEGE DETAILS */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Jagan Institute of Management Studies
          </h2>

          <div className="space-y-3 text-sm leading-6">
            <p className="flex gap-2">
              <MapPin className="w-4 h-4 mt-1 text-blue-400" />
              3, Institutional Area, Sector-5, Rohini <br />
              (Near Rithala Metro Station), Delhi-110085
            </p>

            <p className="flex gap-2">
              <Phone className="w-4 h-4 mt-1 text-blue-400" />
              +91 45184000 / 01 / 02
            </p>

            <p className="flex gap-2">
              <Phone className="w-4 h-4 mt-1 text-blue-400" />
              +91 45184032 | +91-7827938610
            </p>

            <p className="flex gap-2">
              <Mail className="w-4 h-4 mt-1 text-blue-400" />
              contact@jimsindia.org
            </p>

            <p className="flex gap-2">
              <Globe className="w-4 h-4 mt-1 text-blue-400" />
              www.jimsindia.org
            </p>
          </div>
        </div>

        {/* MIDDLE - IMPORTANT LINKS */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Important Links
          </h2>

          <ul className="space-y-2 text-sm">
            {[
              "AICTE Approval Letters",
              "Mandatory Disclosures",
              "NIRF",
              "NAAC",
              "NBA",
              "Academic Calendar",
              "Finance Documents",
              "MOU between AICTE and Youth4work",
              "Rules & Regulations"
            ].map((item, index) => (
              <li key={index} className="hover:text-blue-400 cursor-pointer">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT - EXTRA LINKS */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Access
          </h2>

          <ul className="space-y-2 text-sm">
            {[
              "MDP Calendar",
              "JIMS 8i - (IJICCT)",
              "Newsletters",
              "Management Quota",
              "Send your queries",
              "Login",
              "Online Fee Payment",
              "Career @ JIMS",
              "Statutory Committees",
              "Grievance Redressal System"
            ].map((item, index) => (
              <li key={index} className="hover:text-blue-400 cursor-pointer">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-slate-700 text-center py-4 text-sm text-slate-400">
        © {new Date().getFullYear()} JIMS Placement & Internship Portal. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;