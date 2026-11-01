// Sample data insertion script for testing the Placement Coordinator system
// Run this after backend server is started to populate test data

const API_BASE = 'http://localhost:5000/api/coordinator';

let coordinatorToken = '';

async function register() {
  console.log('Creating coordinator account...');
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Rajesh Kumar',
      email: 'coordinator@college.edu',
      password: 'Coordinator@123'
    })
  });
  const data = await res.json();
  console.log('Register response:', data);
}

async function login() {
  console.log('Logging in...');
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'coordinator@college.edu',
      password: 'Coordinator@123'
    })
  });
  const data = await res.json();
  coordinatorToken = data.token;
  console.log('Login successful! Token:', coordinatorToken);
  return data.token;
}

async function addStudents() {
  console.log('Adding students...');
  const students = [
    { name: 'Arjun Sharma', email: 'arjun.sharma@college.edu', rollNumber: '2021001', cgpa: 7.5 },
    { name: 'Priya Patel', email: 'priya.patel@college.edu', rollNumber: '2021002', cgpa: 8.2 },
    { name: 'Rahul Singh', email: 'rahul.singh@college.edu', rollNumber: '2021003', cgpa: 7.8 },
    { name: 'Neha Gupta', email: 'neha.gupta@college.edu', rollNumber: '2021004', cgpa: 8.5 },
    { name: 'Vikas Kumar', email: 'vikas.kumar@college.edu', rollNumber: '2021005', cgpa: 7.2 }
  ];

  for (const student of students) {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coordinatorToken}`
      },
      body: JSON.stringify(student)
    });
    const data = await res.json();
    console.log('Student added:', data.name);
  }
}

async function addCompanies() {
  console.log('Adding companies...');
  const companies = [
    {
      name: 'TCS',
      email: 'recruitment@tcs.com',
      website: 'https://www.tcs.com',
      description: 'Tata Consultancy Services - Leading IT Services Company'
    },
    {
      name: 'Infosys',
      email: 'careers@infosys.com',
      website: 'https://www.infosys.com',
      description: 'Infosys Limited - Global IT Consulting Company'
    },
    {
      name: 'Wipro',
      email: 'jobs@wipro.com',
      website: 'https://www.wipro.com',
      description: 'Wipro Limited - IT Services and Consulting'
    },
    {
      name: 'HCL Technologies',
      email: 'careers@hcl.com',
      website: 'https://www.hcltechnologies.com',
      description: 'HCL Technologies - Digital IT Services'
    },
    {
      name: 'Accenture',
      email: 'recruitment@accenture.com',
      website: 'https://www.accenture.com',
      description: 'Accenture - Professional Services Company'
    }
  ];

  for (const company of companies) {
    const res = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coordinatorToken}`
      },
      body: JSON.stringify(company)
    });
    const data = await res.json();
    console.log('Company added (Registering):', data.name);
  }
}

async function getCompanies() {
  console.log('Fetching companies...');
  const res = await fetch(`${API_BASE}/companies`, {
    headers: {
      'Authorization': `Bearer ${coordinatorToken}`
    }
  });
  const companies = await res.json();
  console.log(`Found ${companies.length} companies`);
  return companies;
}

async function approveCompanies(companies) {
  console.log('Approving companies (first 3)...');
  for (let i = 0; i < Math.min(3, companies.length); i++) {
    const company = companies[i];
    const res = await fetch(`${API_BASE}/companies/${company._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coordinatorToken}`
      },
      body: JSON.stringify({ status: 'registered' })
    });
    const data = await res.json();
    console.log('Company approved:', data.name);
  }
}

async function addJobs(companies) {
  console.log('Adding jobs...');
  const registeredCompanies = companies.filter(c => c.status === 'registered');

  const jobs = [
    { title: 'Software Engineer', description: 'Develop and maintain software applications', location: 'Bangalore' },
    { title: 'Senior Software Engineer', description: 'Lead development teams', location: 'Bangalore' },
    { title: 'Data Analyst', description: 'Analyze business data', location: 'Mumbai' },
    { title: 'Business Analyst', description: 'Analyze business requirements', location: 'Delhi' },
    { title: 'Full Stack Developer', description: 'Develop web applications', location: 'Bangalore' }
  ];

  let jobIndex = 0;
  for (const job of jobs) {
    if (jobIndex >= registeredCompanies.length) jobIndex = 0;
    const company = registeredCompanies[jobIndex];

    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coordinatorToken}`
      },
      body: JSON.stringify({
        ...job,
        company: company._id,
        salary: '5-8 LPA',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      })
    });
    const data = await res.json();
    console.log('Job added:', data.title, 'at', company.name);
    jobIndex++;
  }
}

async function runAll() {
  try {
    // Step 1: Register coordinator
    await register();

    // Step 2: Login
    await login();

    // Step 3: Add students
    await addStudents();

    // Step 4: Add companies
    await addCompanies();

    // Step 5: Get companies and approve some
    const companies = await getCompanies();
    await approveCompanies(companies);

    // Step 6: Add jobs (after approval)
    const updatedCompanies = await getCompanies();
    await addJobs(updatedCompanies);

    console.log('\n✅ Sample data setup complete!');
    console.log('You can now:');
    console.log('1. Login with: email: coordinator@college.edu, password: Coordinator@123');
    console.log('2. View the dashboard with all stats');
    console.log('3. See companies in registering and registered states');
    console.log('4. View approved companies and their job postings');
  } catch (err) {
    console.error('Error:', err);
  }
}

// Run if called directly
if (typeof window === 'undefined') {
  // Node.js environment
  runAll();
} else {
  // Browser environment - expose functions
  window.setupTestData = { register, login, addStudents, addCompanies, getCompanies, approveCompanies, addJobs, runAll };
  console.log('Test data setup functions available:');
  console.log('- runAll() - Run everything at once');
  console.log('- register() - Create coordinator account');
  console.log('- login() - Login to system');
  console.log('- addStudents() - Add sample students');
  console.log('- addCompanies() - Add sample companies');
  console.log('- approveCompanies() - Approve first 3 companies');
  console.log('- addJobs() - Add sample job postings');
}
