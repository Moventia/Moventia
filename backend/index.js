// ─────────────────────────────────────────────────────────────────────────────
// Moventia Backend – Express API Server (TMDB + in-memory)
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Route imports
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import movieRoutes from './routes/movies.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import chatbotRoutes from './routes/chatbot.js';
import favoritesRoutes from './routes/favorites.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moventia';

// ── Connect to MongoDB ───────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/favorites', favoritesRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Moventia API is running',
    version: '3.0.0',
    movieSource: 'TMDB API',
    userData: 'MongoDB',
  });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const hasKey = !!process.env.TMDB_API_KEY;
  console.log(`\n🎬  Moventia API server running on http://localhost:${PORT}`);
  console.log(`    Movies: ${hasKey ? '✅ TMDB API connected' : '❌ TMDB_API_KEY not set in .env'}`);
  console.log(`    User data: MongoDB\n`);
});
