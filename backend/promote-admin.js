import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const identifier = process.argv[2];

if (!identifier) {
  console.log('----------------------------------------------------');
  console.log('Usage: node promote-admin.js <email-or-userId>');
  console.log('Example: node promote-admin.js admin@college.edu');
  console.log('----------------------------------------------------');
  process.exit(1);
}

async function promote() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/placement';
  console.log('Connecting to database...');
  await mongoose.connect(uri);

  const user = await User.findOne({
    $or: [
      { email: identifier },
      { userId: identifier }
    ]
  });

  if (!user) {
    console.error(`\x1b[31mError: User "${identifier}" was not found in the database.\x1b[0m`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const previousRole = user.role;
  user.role = 'super_admin';
  await user.save();

  console.log('\x1b[32m%s\x1b[0m', `✓ Successfully granted Super Admin rights!`);
  console.log(`- User: ${user.name || user.userId || 'Admin'} (${user.email})`);
  console.log(`- Previous Role: ${previousRole}`);
  console.log(`- New Role: ${user.role}`);
  console.log(`- Access URL: http://localhost:5173/super-admin (or /super-admin-dashboard)`);

  await mongoose.disconnect();
  process.exit(0);
}

promote().catch(async (err) => {
  console.error('\x1b[31mPromotion failed:\x1b[0m', err.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});

