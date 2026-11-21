import mongoose from 'mongoose';
import app from '../backend/server.js';

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected && process.env.MONGO_URI) {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
      }
      isConnected = true;
    } catch (err) {
      console.error('MongoDB serverless connection error:', err);
    }
  }
  return app(req, res);
}
