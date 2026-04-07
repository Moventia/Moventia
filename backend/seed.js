// ─────────────────────────────────────────────────────────────────────────────
// Seed script — populates MongoDB with initial movie data.
// Run:  node seed.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './models/Movie.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moventia';

const seedMovies = [
  {
    title: 'Stellar Odyssey',
    year: 2024,
    genre: ['Sci-Fi', 'Adventure'],
    poster: 'https://images.unsplash.com/photo-1653045474061-075ba29db54f?w=400',
    rating: 4.5,
    reviewCount: 0,
    synopsis:
      "A thrilling journey through space as a crew discovers an ancient alien civilization that holds the key to humanity's future.",
    director: 'Emma Rodriguez',
    cast: ['John Blake', 'Sarah Kim', 'Marcus Johnson'],
    duration: '2h 28m',
  },
  {
    title: 'Midnight Shadows',
    year: 2025,
    genre: ['Horror', 'Thriller'],
    poster: 'https://images.unsplash.com/photo-1630338679229-99fb150fbf88?w=400',
    rating: 4.2,
    reviewCount: 0,
    synopsis:
      'A family moves into an old mansion only to discover they are not alone. Dark secrets from the past come back to haunt them.',
    director: 'David Chen',
    cast: ['Emily Watson', 'Tom Hardy', 'Lisa Anderson'],
    duration: '1h 52m',
  },
  {
    title: 'Hearts in Paris',
    year: 2024,
    genre: ['Romance', 'Drama'],
    poster: 'https://images.unsplash.com/photo-1708787788824-07d6d97b0111?w=400',
    rating: 3.8,
    reviewCount: 0,
    synopsis:
      'Two strangers meet by chance in Paris and embark on a whirlwind romance that changes their lives forever.',
    director: 'Sophie Laurent',
    cast: ['Pierre Dubois', 'Claire Martin', 'Jacques Bernard'],
    duration: '1h 45m',
  },
  {
    title: 'The Last Stand',
    year: 2025,
    genre: ['Action', 'Thriller'],
    poster: 'https://images.unsplash.com/photo-1765510296004-614b6cc204da?w=400',
    rating: 4.6,
    reviewCount: 0,
    synopsis:
      "When a rogue agent threatens global security, an elite team must stop them before it's too late in this explosive thriller.",
    director: 'Michael Bay',
    cast: ['Chris Evans', 'Zoe Saldana', 'Idris Elba'],
    duration: '2h 15m',
  },
  {
    title: 'Laugh Out Loud',
    year: 2024,
    genre: ['Comedy'],
    poster: 'https://images.unsplash.com/photo-1762417421419-f5f8ecfe9136?w=400',
    rating: 3.9,
    reviewCount: 0,
    synopsis:
      'A struggling comedian gets one last chance to make it big, but everything that can go wrong does in this hilarious comedy.',
    director: 'Judd Apatow',
    cast: ['Kevin Hart', 'Amy Poehler', 'Seth Rogen'],
    duration: '1h 38m',
  },
  {
    title: 'Broken Dreams',
    year: 2025,
    genre: ['Drama'],
    poster: 'https://images.unsplash.com/photo-1647962982511-f120db3d63c8?w=400',
    rating: 4.3,
    reviewCount: 0,
    synopsis:
      "A powerful drama about family, loss, and redemption as three siblings reunite after their father's unexpected death.",
    director: 'Greta Gerwig',
    cast: ['Meryl Streep', 'Timothée Chalamet', 'Saoirse Ronan'],
    duration: '2h 5m',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing movies
    const deleted = await Movie.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing movies`);

    // Insert seed data
    const inserted = await Movie.insertMany(seedMovies);
    console.log(`✅ Seeded ${inserted.length} movies:`);
    inserted.forEach((m) => console.log(`   • ${m.title} (${m._id})`));

    await mongoose.disconnect();
    console.log('\nDone! MongoDB disconnected.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
