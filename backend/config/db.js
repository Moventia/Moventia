// ─────────────────────────────────────────────────────────────────────────────
// MongoDB connection
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import dns from 'node:dns';

export async function connectDB() {
  // Configure fallback DNS servers (Google / Cloudflare) to prevent querySrv ECONNREFUSED errors on Windows / local ISP DNS
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (dnsErr) {
    console.warn('⚠️ Could not override DNS servers:', dnsErr.message);
  }

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
