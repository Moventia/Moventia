// ─────────────────────────────────────────────────────────────────────────────
// MongoDB connection
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moventia';

  try {
    await mongoose.connect(uri);
    console.log(`📦  MongoDB connected → ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
}
