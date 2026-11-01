import mongoose from 'mongoose';

const uri = '';

console.log('Connecting to MongoDB Atlas via standard replica set string...');
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB Connected successfully!');
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('Connection failed:', err);
  process.exit(1);
}
