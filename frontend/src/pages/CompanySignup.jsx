// import { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate, Link } from 'react-router-dom';
// import { Building, Building2, User, Mail, Globe, Lock, Phone, MapPin, Map } from 'lucide-react';

// const CompanySignup = () => {
//     const { signupCompany } = useAuth();
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [formData, setFormData] = useState({
//         name: '', email: '', password: '', website: '', description: '', contactPerson: '', phone: '',
//         headquarters: { address: '', city: '', state: '', country: 'India' },
//         branchLocations: '',
//         googleMapsUrl: ''
//     });

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');
//         setLoading(true);
//         try {
//             const payload = {
//                 ...formData,
//                 branchLocations: typeof formData.branchLocations === 'string'
//                     ? formData.branchLocations.split(',').map(s => s.trim()).filter(Boolean)
//                     : formData.branchLocations
//             };
//             await signupCompany(payload);
//             navigate('/company-dashboard');
//         } catch (err) {
//             setError(err.response?.data?.error || 'Failed to create account.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-4 flex items-center justify-center">
//             <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
                
//                 {/* Header */}
//                 <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 px-6 py-4 text-white text-center">
//                     <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 border border-white/20">
//                         <Building2 className="w-8 h-8 text-blue-200" />
//                     </div>
//                     <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
//                         Company Registration
//                     </h2>
//                     <p className="text-blue-100 mt-3 text-sm md:text-base max-w-xl mx-auto leading-6">
//                         Create your company account to post jobs, connect with students,
//                         and hire talent through the placement portal.
//                     </p>
//                 </div>

//                 {/* Form Section */}
//                 <div className="p-6 sm:p-8 md:p-10">
//                     {error && (
//                         <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200 font-medium text-center">
//                             {error}
//                         </div>
//                     )}

//                     <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
//                         <div className="grid md:grid-cols-2 gap-5">
//                             <div>
//                                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                                     Company Name *
//                                 </label>
//                                 <div className="relative">
//                                     <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                                     <input
//                                         required
//                                         type="text"
//                                         autoComplete="off"
//                                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//                                         value={formData.name}
//                                         onChange={e => setFormData({ ...formData, name: e.target.value })}
//                                         placeholder="Acme Corp"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                                     Company Email *
//                                 </label>
//                                 <div className="relative">
//                                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                                     <input
//                                         required
//                                         type="email"
//                                         autoComplete="off"
//                                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//                                         value={formData.email}
//                                         onChange={e => setFormData({ ...formData, email: e.target.value })}
//                                         placeholder="hr@acme.com"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="grid md:grid-cols-2 gap-5">
//                             <div>
//                                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                                     Password *
//                                 </label>
//                                 <div className="relative">
//                                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                                     <input
//                                         required
//                                         type="password"
//                                         minLength="6"
//                                         autoComplete="new-password"
//                                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//                                         value={formData.password}
//                                         onChange={e => setFormData({ ...formData, password: e.target.value })}
//                                         placeholder="••••••••"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                                     Website
//                                 </label>
//                                 <div className="relative">
//                                     <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                                     <input
//                                         type="url"
//                                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//                                         value={formData.website}
//                                         onChange={e => setFormData({ ...formData, website: e.target.value })}
//                                         placeholder="https://acme.com"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="grid md:grid-cols-2 gap-5">
//                             <div>
//                                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                                     Contact Person
//                                 </label>
//                                 <div className="relative">
//                                     <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                                     <input
//                                         type="text"
//                                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//                                         value={formData.contactPerson}
//                                         onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
//                                         placeholder="Jane Doe"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                                     Phone Number
//                                 </label>
//                                 <div className="relative">
//                                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                                     <input
//                                         type="tel"
//                                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//                                         value={formData.phone}
//                                         onChange={e => setFormData({ ...formData, phone: e.target.value })}
//                                         placeholder="+91 984267xxxx"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Headquarters & Office Locations */}
//                         <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
//                             <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
//                                 <MapPin className="w-4 h-4 text-blue-600" /> Company Headquarters & Locations
//                             </h3>
//                             <div className="grid md:grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-xs font-semibold text-slate-600 mb-1">HQ Street Address</label>
//                                     <input
//                                         type="text"
//                                         className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//                                         value={formData.headquarters.address}
//                                         onChange={e => setFormData({ ...formData, headquarters: { ...formData.headquarters, address: e.target.value } })}
//                                         placeholder="e.g. Cyber City, Sector 24"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-xs font-semibold text-slate-600 mb-1">HQ City</label>
//                                     <input
//                                         type="text"
//                                         className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//                                         value={formData.headquarters.city}
//                                         onChange={e => setFormData({ ...formData, headquarters: { ...formData.headquarters, city: e.target.value } })}
//                                         placeholder="e.g. Gurugram"
//                                     />
//                                 </div>
//                             </div>
//                             <div className="grid md:grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-xs font-semibold text-slate-600 mb-1">HQ State</label>
//                                     <input
//                                         type="text"
//                                         className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//                                         value={formData.headquarters.state}
//                                         onChange={e => setFormData({ ...formData, headquarters: { ...formData.headquarters, state: e.target.value } })}
//                                         placeholder="e.g. Haryana"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-xs font-semibold text-slate-600 mb-1">HQ Country</label>
//                                     <input
//                                         type="text"
//                                         className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//                                         value={formData.headquarters.country}
//                                         onChange={e => setFormData({ ...formData, headquarters: { ...formData.headquarters, country: e.target.value } })}
//                                         placeholder="India"
//                                     />
//                                 </div>
//                             </div>
//                             <div className="grid md:grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-xs font-semibold text-slate-600 mb-1">Other Office / Branch Locations (comma separated)</label>
//                                     <input
//                                         type="text"
//                                         className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//                                         value={formData.branchLocations}
//                                         onChange={e => setFormData({ ...formData, branchLocations: e.target.value })}
//                                         placeholder="e.g. Bengaluru, Hyderabad, Pune, Noida"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-xs font-semibold text-slate-600 mb-1">Google Maps Link (optional)</label>
//                                     <input
//                                         type="url"
//                                         className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
//                                         value={formData.googleMapsUrl}
//                                         onChange={e => setFormData({ ...formData, googleMapsUrl: e.target.value })}
//                                         placeholder="https://maps.google.com/..."
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         <div>
//                             <label className="block text-sm font-semibold text-slate-700 mb-2">
//                                 Company Description
//                             </label>
//                             <textarea
//                                 rows="4"
//                                 className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition"
//                                 value={formData.description}
//                                 onChange={e => setFormData({ ...formData, description: e.target.value })}
//                                 placeholder="Brief description about your company culture and mission..."
//                             ></textarea>
//                         </div>

//                         <button
//                             disabled={loading}
//                             type="submit"
//                             className={`w-full py-3.5 text-white font-bold rounded-xl transition-all shadow-md ${
//                                 loading
//                                     ? 'bg-slate-400 cursor-not-allowed'
//                                     : 'bg-slate-900 hover:bg-blue-700 active:scale-[0.99]'
//                             }`}
//                         >
//                             {loading ? 'Creating Account...' : 'Complete Registration'}
//                         </button>

//                         <div className="text-center pt-2 text-sm text-slate-500">
//                             Already have an account?{' '}
//                             <Link to="/login" className="text-blue-700 font-semibold hover:underline">
//                                 Log in
//                             </Link>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default CompanySignup;


import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Building2, User, Mail, Globe, Lock, Phone } from 'lucide-react';

const CompanySignup = () => {
    const { signupCompany } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', website: '', description: '', contactPerson: '', phone: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signupCompany(formData);
            navigate('/company-dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-4 flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 px-6 py-4 text-white text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 border border-white/20">
                        <Building2 className="w-8 h-8 text-blue-200" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                        Company Registration
                    </h2>
                    <p className="text-blue-100 mt-3 text-sm md:text-base max-w-xl mx-auto leading-6">
                        Create your company account to post jobs, connect with students,
                        and hire talent through the placement portal.
                    </p>
                </div>

                {/* Form Section */}
                <div className="p-6 sm:p-8 md:p-10">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200 font-medium text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Company Name *
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        required
                                        type="text"
                                        autoComplete="off"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Acme Corp"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Company Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        required
                                        type="email"
                                        autoComplete="off"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="hr@acme.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        required
                                        type="password"
                                        minLength="6"
                                        autoComplete="new-password"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Website
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://acme.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Contact Person
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={formData.contactPerson}
                                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                        placeholder="Jane Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="tel"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 984267xxxx"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Company Description
                            </label>
                            <textarea
                                rows="4"
                                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description about your company culture and mission..."
                            ></textarea>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className={`w-full py-3.5 text-white font-bold rounded-xl transition-all shadow-md ${
                                loading
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-slate-900 hover:bg-blue-700 active:scale-[0.99]'
                            }`}
                        >
                            {loading ? 'Creating Account...' : 'Complete Registration'}
                        </button>

                        <div className="text-center pt-2 text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/company-login" className="text-blue-700 font-semibold hover:underline">
                                Log in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompanySignup;