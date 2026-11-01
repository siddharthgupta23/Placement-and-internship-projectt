import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import StudentProfile from './models/Student.js';
import CompanyProfile from './models/Company.js';
import Job from './models/Job.js';
import Application from './models/Application.js';

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/placement';

async function seed() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to DB:', DB_URI);

        console.log('Clearing existing data (Enforcing NO seeded applications/jobs/companies)...');
        try { await User.deleteMany({}); } catch(e){}
        try { await StudentProfile.deleteMany({}); } catch(e){}
        try { await CompanyProfile.deleteMany({}); } catch(e){}
        try { await Job.deleteMany({}); } catch(e){}
        try { await Application.deleteMany({}); } catch(e){}
        console.log('Cleared existing data.');

        const defaultPassword = await bcrypt.hash('password123', 10);

        // 1. Create Admin
        await User.create({
            userId: 'admin',
            name: 'Primary Admin',
            email: 'admin@college.edu',
            password: defaultPassword,
            role: 'admin'
        });
        console.log('Created Admin (userId: admin, pw: password123)');

        // 1.b Create Faculty (acting as admin coordinator)
        await User.create({
            userId: 'faculty',
            name: 'Faculty Coordinator',
            email: 'faculty@college.edu',
            password: defaultPassword,
            role: 'admin'
        });
        console.log('Created Faculty (userId: faculty, pw: password123)');

        await User.create({
            userId: 'superadmin',
            name: 'Super Admin',
            email: 'superadmin@college.edu',
            password: defaultPassword,
            role: 'super_admin'
        });
        console.log('Created Super Admin (userId: superadmin, pw: password123)');

        // 2. Create handful of empty Students
        const createdStudents = [];
        for (let i = 1; i <= 10; i++) {
            const stuId = `STU${String(i).padStart(3, '0')}`;
            const user = await User.create({
                userId: stuId,
                name: `Student Name ${i}`,
                email: `student${i}@college.edu`,
                password: defaultPassword,
                role: 'student'
            });

            // Blank profile - data will be extracted dynamically from resume or entered manually.
            const profile = await StudentProfile.create({
                user: user._id,
                name: `Student Name ${i}`,
                branch: '',
                year: '',
                skills: [],
                cgpa: null
            });
            createdStudents.push(profile);
        }
        console.log(`Created ${createdStudents.length} Empty Students (STU001, etc.)`);

        console.log('\nSeeding completed successfully!');
        console.log('NOTE: Following STRICT data policy. Companies, Jobs, and Applications are completely EMPTY and must be natively created via the application UI.');
        process.exit(0);

    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
