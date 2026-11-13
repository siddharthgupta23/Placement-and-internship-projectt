// import { Mail, Phone, Globe, MapPin } from "lucide-react";

// const Footer = () => {
//   return (
//     <footer className="w-full bg-slate-900 text-slate-300 mt-16">
//       <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">

//         {/* LEFT - COLLEGE DETAILS */}
//         <div>
//           <h2 className="text-xl font-bold text-white mb-4">
//             Jagan Institute of Management Studies
//           </h2>

//           <div className="space-y-3 text-sm leading-6">
//             <p className="flex gap-2">
//               <MapPin className="w-4 h-4 mt-1 text-blue-400" />
//               3, Institutional Area, Sector-5, Rohini <br />
//               (Near Rithala Metro Station), Delhi-110085
//             </p>

//             <p className="flex gap-2">
//               <Phone className="w-4 h-4 mt-1 text-blue-400" />
//               +91 45184000 / 01 / 02
//             </p>

//             <p className="flex gap-2">
//               <Phone className="w-4 h-4 mt-1 text-blue-400" />
//               +91 45184032 | +91-7827938610
//             </p>

//             <p className="flex gap-2">
//               <Mail className="w-4 h-4 mt-1 text-blue-400" />
//               contact@jimsindia.org
//             </p>

//             <p className="flex gap-2">
//               <Globe className="w-4 h-4 mt-1 text-blue-400" />
//               www.jimsindia.org
//             </p>
//           </div>
//         </div>

//         {/* MIDDLE - IMPORTANT LINKS */}
//         <div>
//           <h2 className="text-lg font-semibold text-white mb-4">
//             Important Links
//           </h2>

//           <ul className="space-y-2 text-sm">
//             {[
//               "AICTE Approval Letters",
//               "Mandatory Disclosures",
//               "NIRF",
//               "NAAC",
//               "NBA",
//               "Academic Calendar",
//               "Finance Documents",
//               "MOU between AICTE and Youth4work",
//               "Rules & Regulations"
//             ].map((item, index) => (
//               <li key={index} className="hover:text-blue-400 cursor-pointer">
//                 {item}
//               </li>
//             ))}
//           </ul>
//         </div>

//         {/* RIGHT - EXTRA LINKS */}
//         <div>
//           <h2 className="text-lg font-semibold text-white mb-4">
//             Quick Access
//           </h2>

//           <ul className="space-y-2 text-sm">
//             {[
//               "MDP Calendar",
//               "JIMS 8i - (IJICCT)",
//               "Newsletters",
//               "Management Quota",
//               "Send your queries",
//               "Login",
//               "Online Fee Payment",
//               "Career @ JIMS",
//               "Statutory Committees",
//               "Grievance Redressal System"
//             ].map((item, index) => (
//               <li key={index} className="hover:text-blue-400 cursor-pointer">
//                 {item}
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* BOTTOM */}
//       <div className="border-t border-slate-700 text-center py-4 text-sm text-slate-400">
//         © {new Date().getFullYear()} JIMS Placement & Internship Portal. All rights reserved.
//       </div>
//     </footer>
//   );
// };

// export default Footer;

import { Mail, Phone, Globe, MapPin } from "lucide-react";

const importantLinks = [
  "AICTE Approval Letters",
  "Mandatory Disclosures",
  "NIRF",
  "NAAC",
  "NBA",
  "Academic Calendar",
  "Finance Documents",
  "MOU between AICTE and Youth4work",
  "Rules & Regulations",
];

const quickLinks = [
  "MDP Calendar",
  "JIMS 8i - (IJICCT)",
  "Newsletters",
  "Management Quota",
  "Send your queries",
  "Login",
  "Online Fee Payment",
  "Career @ JIMS",
  "Statutory Committees",
  "Grievance Redressal System",
];

const LinkList = ({ title, items }) => (
  <div>
    <h2 className="mb-2 text-sm font-semibold text-white">{title}</h2>
    <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="cursor-pointer hover:text-blue-400">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  return (
    <footer className="mt-8 w-full bg-slate-900 text-slate-300">
      <div className="w-full px-6 sm:px-8 lg:px-12">
        <div className="grid gap-6 py-6 md:grid-cols-[1fr_1.2fr_1.2fr]">
          {/* LEFT - COLLEGE DETAILS */}
          <div>
            <h2 className="mb-2 text-sm font-bold text-white">
              Jagan Institute of Management Studies
            </h2>

            <div className="space-y-1.5 text-xs leading-5">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span>
                  3, Institutional Area, Sector-5, Rohini (Near Rithala Metro
                  Station), Delhi-110085
                </span>
              </p>

              <p className="flex gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span>
                  +91 45184000 / 01 / 02 | +91 45184032 | +91-7827938610
                </span>
              </p>

              <p className="flex gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                contact@jimsindia.org
              </p>

              <p className="flex gap-2">
                <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                www.jimsindia.org
              </p>
            </div>
          </div>

          <LinkList title="Important Links" items={importantLinks} />
          <LinkList title="Quick Access" items={quickLinks} />
        </div>

        {/* BOTTOM */}
        <div className="border-t border-slate-700 py-3 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} JIMS Placement &amp; Internship Portal.
          All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;