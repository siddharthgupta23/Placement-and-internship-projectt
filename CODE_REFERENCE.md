# Code Reference & Key Implementation Details

## Backend Implementation Highlights

### 1. Company Status Management

**Model Changes**
```javascript
// models/Company.js
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  website: { type: String },
  description: { type: String },
  status: { type: String, enum: ['registering', 'registered'], default: 'registering' },
  registeredDate: { type: Date, default: null },
  contactPerson: { type: String },
  phone: { type: String },
  jobsPosted: { type: Number, default: 0 }
}, { timestamps: true });
```

**Approval Endpoint**
```javascript
// routes/coordinator.js
router.patch('/companies/:id/status', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const { status } = req.body;  // status: 'registered' or 'registering'
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        registeredDate: status === 'registered' ? new Date() : null 
      },
      { new: true }
    );
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

### 2. Application Tracking

**New Application Model**
```javascript
// models/Application.js
const ApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  status: { 
    type: String, 
    enum: ['applied', 'shortlisted', 'rejected', 'selected', 'offer_accepted'], 
    default: 'applied' 
  },
  appliedOn: { type: Date, default: Date.now },
  resume: { type: String }
}, { timestamps: true });
```

**Application Endpoints**
```javascript
// Get all applications (populated with details)
router.get('/applications', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const list = await Application.find()
      .populate('student')
      .populate('job')
      .populate('company')
      .sort({ appliedOn: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new application
router.post('/applications', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const { studentId, jobId, companyId } = req.body;
    // Check duplicate application
    const existing = await Application.findOne({ student: studentId, job: jobId });
    if (existing) return res.status(400).json({ message: 'Already applied' });
    
    const app = new Application({ 
      student: studentId, 
      job: jobId, 
      company: companyId, 
      status: 'applied' 
    });
    await app.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application status
router.patch('/applications/:id', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

### 3. Statistics Endpoint

```javascript
// Get comprehensive statistics
router.get('/stats', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const stats = {
      students: await Student.countDocuments(),
      companies: await Company.countDocuments(),
      companiesRegistered: await Company.countDocuments({ status: 'registered' }),
      companiesRegistering: await Company.countDocuments({ status: 'registering' }),
      jobs: await Job.countDocuments(),
      placements: await Placement.countDocuments({ status: 'placed' }),
      applications: await Application.countDocuments(),
      applicationsApplied: await Application.countDocuments({ status: 'applied' }),
      applicationsSelected: await Application.countDocuments({ status: 'selected' })
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

### 4. Filtered Company Queries

```javascript
// Get only registered companies
router.get('/companies/registered', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const list = await Company.find({ status: 'registered' }).sort({ registeredDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get companies pending approval
router.get('/companies/registering', verifyToken, requireCoordinator, async (req, res) => {
  try {
    const list = await Company.find({ status: 'registering' }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

---

## Frontend Implementation Highlights

### 1. Authentication & Session Management

```javascript
// Check saved session on mount
useEffect(() => {
  const savedToken = localStorage.getItem('coordinatorToken');
  const savedUser = localStorage.getItem('coordinatorUser');
  if (savedToken && savedUser) {
    setToken(savedToken);
    setUser(JSON.parse(savedUser));
  }
}, []);

// Login function
async function login(e) {
  e.preventDefault();
  setLoading(true);
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

// Logout function
function logout() {
  setToken(null);
  setUser(null);
  localStorage.removeItem('coordinatorToken');
  localStorage.removeItem('coordinatorUser');
}
```

### 2. API Request Headers

```javascript
// Standard auth header for protected requests
const authHeaders = () => ({ 
  Authorization: `Bearer ${token}` 
});

// Used in all protected API calls
const res = await fetch(`${API_BASE}/companies`, {
  headers: authHeaders()
});
```

### 3. Company Approval UI

```javascript
// Company approval handler
async function approveCompany(companyId) {
  try {
    const res = await fetch(`${API_BASE}/companies/${companyId}/status`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'registered' })
    });
    if (res.ok) {
      setMessage('Company approved!');
      fetchAll(); // Refresh data
    }
  } catch (err) {
    setMessage('Error approving company');
  }
}

// UI for registering companies
{registeringCompanies.map(c => (
  <div key={c._id} className="border border-amber-300 bg-amber-50 p-4 rounded-lg">
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="font-semibold text-gray-900">{c.name}</p>
        <p className="text-sm text-gray-600">{c.email}</p>
      </div>
      <span className="bg-amber-200 text-amber-700 px-3 py-1 rounded text-xs font-semibold">
        Registering
      </span>
    </div>
    <div className="flex gap-2">
      <button 
        onClick={() => approveCompany(c._id)}
        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Approve
      </button>
      <button 
        onClick={() => rejectCompany(c._id)}
        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
      >
        Reject
      </button>
    </div>
  </div>
))}
```

### 4. Applications Tab Display

```javascript
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
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Job Title</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Applied On</th>
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
```

### 5. Dashboard Statistics Cards

```javascript
{/* Dashboard statistics */}
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

  {/* More stats cards... */}
</div>
```

### 6. Data Fetching

```javascript
// Fetch all data with parallel requests
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
```

---

## Key Imports

### Backend
```javascript
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
```

### Frontend
```javascript
import React, { useState, useEffect } from 'react';
```

---

## Environment Variables

**Backend (.env)**
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your_super_secret_key_here
PORT=5000
```

**Frontend (vite.config.js)**
```javascript
import.meta.env.VITE_API_URL || 'http://localhost:5000/api/coordinator'
```

---

## Common API Responses

### Success Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "name": "Dr. Rajesh Kumar",
    "email": "coordinator@college.edu",
    "role": "coordinator"
  }
}
```

### Error Response
```json
{
  "message": "Invalid credentials"
}
```

### Statistics Response
```json
{
  "students": 50,
  "companies": 15,
  "companiesRegistered": 10,
  "companiesRegistering": 5,
  "jobs": 25,
  "placements": 30,
  "applications": 120,
  "applicationsApplied": 80,
  "applicationsSelected": 40
}
```

---

## Testing with cURL

### Create Coordinator
```bash
curl -X POST http://localhost:5000/api/coordinator/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Rajesh Kumar","email":"coordinator@college.edu","password":"Coordinator@123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/coordinator/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coordinator@college.edu","password":"Coordinator@123"}'
```

### Get Statistics
```bash
curl http://localhost:5000/api/coordinator/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve Company
```bash
curl -X PATCH http://localhost:5000/api/coordinator/companies/COMPANY_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status":"registered"}'
```

---

This provides complete code reference for understanding and extending the system!
