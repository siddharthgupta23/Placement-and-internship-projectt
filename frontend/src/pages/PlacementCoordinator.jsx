import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/coordinator';

export default function PlacementCoordinator() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [registeredCompanies, setRegisteredCompanies] = useState([]);
  const [registeringCompanies, setRegisteringCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Check localStorage for saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('coordinatorToken');
    const savedUser = localStorage.getItem('coordinatorUser');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (token) fetchAll();
  }, [token]);

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('coordinatorToken', data.token);
        localStorage.setItem('coordinatorUser', JSON.stringify(data.user));
        setMessage('Login successful!');
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
    setLoading(false);
  }

  async function fetchAll() {
    try {
      const [sRes, cRes, jRes, appRes, pRes, stRes, regRes, regingRes] = await Promise.all([
        fetch(`${API_BASE}/students`, { headers: authHeaders() }),
        fetch(`${API_BASE}/companies`, { headers: authHeaders() }),
        fetch(`${API_BASE}/jobs`, { headers: authHeaders() }),
        fetch(`${API_BASE}/applications`, { headers: authHeaders() }),
        fetch(`${API_BASE}/placements`, { headers: authHeaders() }),
        fetch(`${API_BASE}/stats`, { headers: authHeaders() }),
        fetch(`${API_BASE}/companies/registered`, { headers: authHeaders() }),
        fetch(`${API_BASE}/companies/registering`, { headers: authHeaders() })
      ]);
      setStudents(sRes.ok ? await sRes.json() : []);
      setCompanies(cRes.ok ? await cRes.json() : []);
      setJobs(jRes.ok ? await jRes.json() : []);
      setApplications(appRes.ok ? await appRes.json() : []);
      setPlacements(pRes.ok ? await pRes.json() : []);
      setStats(stRes.ok ? await stRes.json() : {});
      setRegisteredCompanies(regRes.ok ? await regRes.json() : []);
      setRegisteringCompanies(regingRes.ok ? await regingRes.json() : []);
    } catch (err) {
      console.error(err);
      setMessage('Error loading data');
    }
  }

  async function approveCompany(companyId) {
    try {
      const res = await fetch(`${API_BASE}/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'registered' })
      });
      if (res.ok) {
        setMessage('Company approved!');
        fetchAll();
      }
    } catch (err) {
      setMessage('Error approving company');
    }
  }

  async function rejectCompany(companyId) {
    try {
      const res = await fetch(`${API_BASE}/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'registering' })
      });
      if (res.ok) {
        setMessage('Company rejected!');
        fetchAll();
      }
    } catch (err) {
      setMessage('Error rejecting company');
    }
  }

  async function addCompany(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const email_val = form.email.value;
    const website = form.website.value;
    const description = form.description.value;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email_val, website, description })
      });
      if (res.ok) {
        setMessage('Company added!');
        form.reset();
        fetchAll();
      }
    } catch (err) {
      setMessage('Error adding company');
    }
    setLoading(false);
  }

  async function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('coordinatorToken');
    localStorage.removeItem('coordinatorUser');
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Placement Coordinator</h2>
            <p className="text-gray-600 text-sm mt-2">Login to manage placements</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@college.edu"
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-5"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {message && <p className={`text-sm mt-3 text-center ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
          <p className="text-xs text-gray-500 mt-4 text-center">
            Contact your administrator if you don't have credentials
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Placement Management System</h1>
            <p className="text-sm text-gray-600">Welcome, <span className="font-semibold">{user?.name || user?.email}</span></p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
          <div className="flex gap-2 p-2">
            {['dashboard', 'companies', 'applications', 'students', 'placements', 'jobs'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.students || 0}</p>
                </div>
                <div className="text-4xl text-blue-200">👥</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Companies (Registered)</p>
                  <p className="text-3xl font-bold text-green-600">{stats.companiesRegistered || 0}</p>
                </div>
                <div className="text-4xl text-green-200">✓</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Companies (Registering)</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.companiesRegistering || 0}</p>
                </div>
                <div className="text-4xl text-amber-200">⏳</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Students Placed</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.placements || 0}</p>
                </div>
                <div className="text-4xl text-purple-200">🎯</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Job Openings</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.jobs || 0}</p>
                </div>
                <div className="text-4xl text-indigo-200">💼</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-pink-600">{stats.applications || 0}</p>
                </div>
                <div className="text-4xl text-pink-200">📝</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Applied (Pending)</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.applicationsApplied || 0}</p>
                </div>
                <div className="text-4xl text-blue-200">📥</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Selected</p>
                  <p className="text-3xl font-bold text-green-600">{stats.applicationsSelected || 0}</p>
                </div>
                <div className="text-4xl text-green-200">🌟</div>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {tab === 'companies' && (
          <div className="space-y-6">
            {/* Add Company Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Company</h3>
              <form onSubmit={addCompany} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="name"
                  placeholder="Company Name"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Company Email"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="website"
                  placeholder="Website URL"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="description"
                  placeholder="Description"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="md:col-span-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Company'}
                </button>
              </form>
            </div>

            {/* Registering Companies */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">Pending Approval</span>
                Companies Registering ({registeringCompanies.length})
              </h3>
              {registeringCompanies.length === 0 ? (
                <p className="text-gray-500">No companies registering</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registeringCompanies.map(c => (
                    <div key={c._id} className="border border-amber-300 bg-amber-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          <p className="text-sm text-gray-600">{c.email}</p>
                          {c.website && <p className="text-sm text-blue-600">{c.website}</p>}
                        </div>
                        <span className="bg-amber-200 text-amber-700 px-3 py-1 rounded text-xs font-semibold">Registering</span>
                      </div>
                      {c.description && <p className="text-sm text-gray-700 mb-3">{c.description}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveCompany(c._id)}
                          className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectCompany(c._id)}
                          className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registered Companies */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">✓ Approved</span>
                Registered Companies ({registeredCompanies.length})
              </h3>
              {registeredCompanies.length === 0 ? (
                <p className="text-gray-500">No registered companies yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registeredCompanies.map(c => (
                    <div key={c._id} className="border border-green-300 bg-green-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          <p className="text-sm text-gray-600">{c.email}</p>
                          {c.website && <p className="text-sm text-blue-600">{c.website}</p>}
                        </div>
                        <span className="bg-green-200 text-green-700 px-3 py-1 rounded text-xs font-semibold">Registered</span>
                      </div>
                      {c.description && <p className="text-sm text-gray-700 my-2">{c.description}</p>}
                      <p className="text-xs text-gray-500">
                        Registered on: {new Date(c.registeredDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {tab === 'applications' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Applications</h3>
              {applications.length === 0 ? (
                <p className="text-gray-500">No applications yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-900">Student</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">Company</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">Job Title</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">Status</th>
                        <th className="px-4 py-3 font-semibold text-gray-900">Applied On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app, idx) => (
                        <tr key={app._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">{app.student?.name}</td>
                          <td className="px-4 py-3">{app.company?.name}</td>
                          <td className="px-4 py-3">{app.job?.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              app.status === 'applied' ? 'bg-blue-100 text-blue-700' :
                              app.status === 'selected' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(app.appliedOn).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {tab === 'students' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Students</h3>
            {students.length === 0 ? (
              <p className="text-gray-500">No students</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {students.map(s => (
                  <div key={s._id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-sm text-gray-600">{s.email}</p>
                    {s.rollNumber && <p className="text-sm text-gray-600">Roll: {s.rollNumber}</p>}
                    {s.cgpa && <p className="text-sm text-blue-600">CGPA: {s.cgpa}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Placements Tab */}
        {tab === 'placements' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Placement Records</h3>
            {placements.length === 0 ? (
              <p className="text-gray-500">No placements yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-900">Student</th>
                      <th className="px-4 py-3 font-semibold text-gray-900">Company</th>
                      <th className="px-4 py-3 font-semibold text-gray-900">Job Title</th>
                      <th className="px-4 py-3 font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-900">Placed On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placements.map((p, idx) => (
                      <tr key={p._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3">{p.student?.name}</td>
                        <td className="px-4 py-3">{p.company?.name}</td>
                        <td className="px-4 py-3">{p.job?.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            p.status === 'placed' ? 'bg-green-100 text-green-700' :
                            p.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.placedOn ? new Date(p.placedOn).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {tab === 'jobs' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Job Openings</h3>
            {jobs.length === 0 ? (
              <p className="text-gray-500">No jobs posted yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(j => (
                  <div key={j._id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition">
                    <p className="font-semibold text-gray-900">{j.title}</p>
                    <p className="text-sm text-gray-600">{j.company?.name}</p>
                    {j.location && <p className="text-sm text-gray-600">📍 {j.location}</p>}
                    {j.salary && <p className="text-sm text-green-600">💰 {j.salary}</p>}
                    {j.description && <p className="text-sm text-gray-700 mt-2">{j.description}</p>}
                    {j.deadline && (
                      <p className="text-xs text-gray-500 mt-2">
                        Deadline: {new Date(j.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
