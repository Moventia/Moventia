// ─────────────────────────────────────────────────────────────────────────────
// Chatbot route — powered by live TMDB data
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth } from '../middleware/auth.js';
import * as tmdb from '../services/tmdb.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const input = message.toLowerCase().trim();
    let responseText = '';

    // ── Genre-based recommendations ──────────────────────────────────
    const genres = await tmdb.getGenres();
    const matchedGenre = genres.find((g) => input.includes(g.name.toLowerCase()));

    if (matchedGenre) {
      const result = await tmdb.discoverByGenre(matchedGenre.id, 1);
      const top = result.movies.slice(0, 5);
      responseText = `Here are some ${matchedGenre.name} movies:\n\n${top
        .map((m) => `• **${m.title}** (${m.year}) — ⭐ ${m.rating}`)
        .join('\n')}`;
    }
    // ── Trending ─────────────────────────────────────────────────────
    else if (input.includes('trending') || input.includes('popular') || input.includes("what's hot")) {
      const result = await tmdb.getTrending(1);
      const top = result.movies.slice(0, 5);
      responseText = `🔥 Trending this week:\n\n${top
        .map((m) => `• **${m.title}** (${m.year}) — ⭐ ${m.rating}`)
        .join('\n')}`;
    }
    // ── Top rated ────────────────────────────────────────────────────
    else if (input.includes('best') || input.includes('top rated') || input.includes('highest rated')) {
      const result = await tmdb.getTopRated(1);
      const top = result.movies.slice(0, 5);
      responseText = `🏆 Top rated movies of all time:\n\n${top
        .map((m) => `• **${m.title}** (${m.year}) — ⭐ ${m.rating}`)
        .join('\n')}`;
    }
    // ── General recommendations ──────────────────────────────────────
    else if (input.includes('recommend') || input.includes('suggest') || input.includes('watch')) {
      const result = await tmdb.getPopular(1);
      const top = result.movies.slice(0, 5);
      responseText = `Here are some popular movies right now:\n\n${top
        .map((m) => `• **${m.title}** (${m.year}) — ⭐ ${m.rating}\n  ${m.synopsis.slice(0, 80)}…`)
        .join('\n\n')}`;
    }
    // ── Search by title ──────────────────────────────────────────────
    else if (input.includes('about') || input.includes('tell me') || input.includes('search')) {
      const query = input.replace(/about|tell me|search|for|the/g, '').trim();
      if (query.length > 1) {
        const result = await tmdb.searchMovies(query, 1);
        if (result.movies.length > 0) {
          const m = result.movies[0];
          responseText = `**${m.title}** (${m.year})\n⭐ ${m.rating} | Genres: ${m.genre.join(', ')}\n\n${m.synopsis}`;
        } else {
          responseText = `I couldn't find any movies matching "${query}". Try a different search!`;
        }
      } else {
        responseText = "What movie would you like to know about? Just tell me the title!";
      }
    }
    // ── Now playing ──────────────────────────────────────────────────
    else if (input.includes('now playing') || input.includes('in theaters') || input.includes('new movies')) {
      const result = await tmdb.getNowPlaying(1);
      const top = result.movies.slice(0, 5);
      responseText = `🎬 Now playing in theaters:\n\n${top
        .map((m) => `• **${m.title}** (${m.year}) — ⭐ ${m.rating}`)
        .join('\n')}`;
    }
    // ── Greeting ─────────────────────────────────────────────────────
    else if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      responseText =
        "Hello! 👋 I'm your movie assistant powered by TMDB. I can help you:\n\n• Find movies by genre (e.g. \"show me action movies\")\n• See what's trending (e.g. \"what's trending\")\n• Get top rated picks (e.g. \"best movies\")\n• Search for movies (e.g. \"tell me about Inception\")\n• See what's in theaters (e.g. \"now playing\")";
    }
    // ── Fallback ─────────────────────────────────────────────────────
    else {
      responseText =
        "I can help with movie recommendations! Try:\n• \"Show me sci-fi movies\"\n• \"What's trending this week?\"\n• \"Tell me about The Dark Knight\"\n• \"What's now playing?\"\n• \"Best movies of all time\"";
    }

    return res.json({ id: uuid(), text: responseText, sender: 'bot', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
