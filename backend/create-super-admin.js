import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/placement';
const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@college.edu';
const password = process.env.SUPER_ADMIN_PASSWORD || 'password123';
const userId = process.env.SUPER_ADMIN_USER_ID || 'superadmin';
const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

async function createSuperAdmin() {
    try {
        await mongoose.connect(DB_URI);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            existingUser.name = name;
            existingUser.userId = userId;
            existingUser.role = 'super_admin';
            existingUser.password = await bcrypt.hash(password, 10);
            await existingUser.save();
            console.log(`Updated existing user ${email} as super_admin`);
        } else {
            await User.create({
                name,
                email,
                userId,
                password: await bcrypt.hash(password, 10),
                role: 'super_admin',
            });
            console.log(`Created super_admin user ${email}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Failed to create super admin:', error);
        process.exit(1);
    }
}

createSuperAdmin();
