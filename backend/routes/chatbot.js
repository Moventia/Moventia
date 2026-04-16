// ─────────────────────────────────────────────────────────────────────────────
// Chatbot route — powered by Groq (Llama 3.3) and live TMDB data
// Uses a reliable prompt-based approach instead of formal tool calling
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import Groq from 'groq-sdk';
import { requireAuth } from '../middleware/auth.js';
import * as tmdb from '../services/tmdb.js';

const router = Router();

// ── Data Fetchers — smart pre-fetch based on user intent ─────────────────────
async function fetchRelevantData(message) {
  const input = message.toLowerCase().trim();
  const context = [];

  try {
    // Check for genre mentions
    const genres = await tmdb.getGenres();
    const matchedGenres = genres.filter(g => input.includes(g.name.toLowerCase()));

    if (matchedGenres.length > 0) {
      for (const genre of matchedGenres.slice(0, 2)) {
        const result = await tmdb.discoverByGenre(genre.id, 1);
        const movies = result.movies.slice(0, 6).map(m => ({
          id: m.id, title: m.title, year: m.year, rating: m.rating, genre: m.genre.join(', '),
        }));
        context.push(`[${genre.name} Movies from TMDB]: ${JSON.stringify(movies)}`);
      }
    }

    // Trending / popular
    if (/trend|popular|hot|buzz|viral/i.test(input)) {
      const result = await tmdb.getTrending(1);
      const movies = result.movies.slice(0, 6).map(m => ({
        id: m.id, title: m.title, year: m.year, rating: m.rating, genre: m.genre.join(', '),
      }));
      context.push(`[Trending Movies from TMDB]: ${JSON.stringify(movies)}`);
    }

    // Top rated / best
    if (/best|top.?rated|highest.?rated|greatest|classic/i.test(input)) {
      const result = await tmdb.getTopRated(1);
      const movies = result.movies.slice(0, 6).map(m => ({
        id: m.id, title: m.title, year: m.year, rating: m.rating, genre: m.genre.join(', '),
      }));
      context.push(`[Top Rated Movies from TMDB]: ${JSON.stringify(movies)}`);
    }

    // Now playing / in theaters
    if (/now.?playing|theater|cinema|new.?release|new.?movie|latest/i.test(input)) {
      const result = await tmdb.getNowPlaying(1);
      const movies = result.movies.slice(0, 6).map(m => ({
        id: m.id, title: m.title, year: m.year, rating: m.rating, genre: m.genre.join(', '),
      }));
      context.push(`[Now Playing in Theaters from TMDB]: ${JSON.stringify(movies)}`);
    }

    // Search if the user seems to be asking about a specific movie or wants recommendations
    // Extract potential movie titles or search terms
    const searchPatterns = [
      /(?:similar to|like|about|tell me about|search for|find|know about|details? (?:of|on|about))\s+(.+)/i,
      /^(.{3,40})(?:\?|$)/i, // Short messages that could be movie titles
    ];

    for (const pattern of searchPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        const query = match[1].replace(/[?.!]/g, '').trim();
        if (query.length > 2 && !/^(hi|hey|hello|thanks|thank|yes|no|ok|please|help|recommend|suggest)$/i.test(query)) {
          const result = await tmdb.searchMovies(query, 1);
          if (result.movies.length > 0) {
            const movies = result.movies.slice(0, 5).map(m => ({
              id: m.id, title: m.title, year: m.year, rating: m.rating,
              genre: m.genre.join(', '), synopsis: m.synopsis?.slice(0, 150),
            }));
            context.push(`[Search results for "${query}" from TMDB]: ${JSON.stringify(movies)}`);

            // Also get details for the top result
            try {
              const detail = await tmdb.getMovieDetail(result.movies[0].id);
              context.push(`[Detailed info for "${detail.title}"]: ${JSON.stringify({
                title: detail.title, year: detail.year, rating: detail.rating,
                genre: detail.genre.join(', '), director: detail.director,
                cast: detail.cast?.slice(0, 5), duration: detail.duration,
                synopsis: detail.synopsis, tagline: detail.tagline,
              })}`);
            } catch { /* skip detail if it fails */ }
          }
          break; // Only one search
        }
      }
    }

    // If nothing matched and it seems like a recommendation request, give popular movies
    if (context.length === 0 && /recommend|suggest|watch|good movie|what should/i.test(input)) {
      const result = await tmdb.getPopular(1);
      const movies = result.movies.slice(0, 6).map(m => ({
        id: m.id, title: m.title, year: m.year, rating: m.rating, genre: m.genre.join(', '),
      }));
      context.push(`[Popular Movies Right Now from TMDB]: ${JSON.stringify(movies)}`);
    }
  } catch (err) {
    console.error('[Chatbot] Data fetch error:', err.message);
  }

  return context;
}

const SYSTEM_PROMPT = `You are the Moventia Movie Assistant — a friendly, highly knowledgeable cinephile who ONLY discusses movies, TV shows, actors, directors, and the film industry.

STRICT RULES:
1. You MUST ONLY answer questions related to movies, films, TV shows, actors, directors, screenwriters, cinematography, film genres, movie recommendations, plot discussions, and the entertainment industry.
2. If a user asks about ANYTHING unrelated to movies or entertainment (e.g. coding, math, science, politics, cooking, sports, personal advice, general knowledge), respond ONLY with:
   "🎬 I'm your movie assistant! I can only help with movie-related questions — like finding films, getting recommendations, or discussing actors and directors. Try asking me something about movies!"
3. Do NOT answer non-movie questions even if the user insists. Always redirect them to movie topics.
4. Greetings like "hi", "hello", "hey" are fine — respond warmly and suggest what you can help with.

RESPONSE FORMAT:
- When movie data from TMDB is provided in the conversation, USE IT to give accurate answers. Never make up movie data.
- Use Markdown: **bold** for movie titles, bullet points for lists, ⭐ for ratings.
- Keep responses concise but engaging (2-4 short paragraphs max).
- When listing movies, format them as: • [**Title** (Year)](/movie/TMDB_ID) — ⭐ Rating | Genres
- IMPORTANT: Always wrap movie titles with a markdown link to /movie/TMDB_ID using the movie's TMDB id from the data. For example: [**The Shawshank Redemption** (1994)](/movie/278)
- If the user asks about a specific movie and you have its details, share synopsis, cast, director, and rating.
- If no TMDB data is available for the query, you can still chat about movies using your general knowledge, but mention that you're speaking from general knowledge.
- Be conversational, warm, and enthusiastic about movies! Use emojis sparingly.`;

// ── POST /api/chatbot ────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    console.log(`[Chatbot] Received: "${message?.slice(0, 50)}${message?.length > 50 ? '...' : ''}" from user: ${req.user?._id}`);

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if API key is configured
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.json({
        id: uuid(),
        text: "I'm ready to help, but my AI brain (Groq API key) isn't configured yet! 🧠\n\nPlease add a valid `GROQ_API_KEY` to the backend `.env` file.\n\nGet a free key at [console.groq.com](https://console.groq.com/keys).",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      });
    }

    // ── Pre-fetch relevant TMDB data ──────────────────────────────────────────
    const tmdbContext = await fetchRelevantData(message);
    console.log(`[Chatbot] Fetched ${tmdbContext.length} data context(s)`);

    // ── Build message history ─────────────────────────────────────────────────
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

    // Add conversation history (limit to last 10 exchanges to stay within token limits)
    if (Array.isArray(history)) {
      const recent = history.slice(-20); // last 20 messages (10 exchanges)
      for (const msg of recent) {
        if (msg.sender === 'user') {
          messages.push({ role: 'user', content: msg.text });
        } else if (msg.sender === 'bot') {
          messages.push({ role: 'assistant', content: msg.text });
        }
      }
    }

    // Add user's current message with TMDB context injected
    let userContent = message;
    if (tmdbContext.length > 0) {
      userContent = `${message}\n\n--- TMDB Data (use this to answer) ---\n${tmdbContext.join('\n')}`;
    }
    messages.push({ role: 'user', content: userContent });

    // ── Call Groq ─────────────────────────────────────────────────────────────
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again!";
    console.log(`[Chatbot] Response: "${responseText.slice(0, 60)}..."`);

    return res.json({
      id: uuid(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('❌ [Chatbot] Error:', err.message);

    // Handle rate limit
    if (err.status === 429 || err.message?.includes('429') || err.message?.includes('rate')) {
      return res.json({
        id: uuid(),
        text: "⏳ I've hit my API rate limit. Please **wait a moment** and try again!",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      });
    }

    // Handle auth errors
    if (err.status === 401 || err.message?.includes('401') || err.message?.includes('API key')) {
      return res.json({
        id: uuid(),
        text: "🔑 My API key seems invalid. Please check the `GROQ_API_KEY` in the backend `.env` file.\n\nGet a free key at [console.groq.com](https://console.groq.com/keys).",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      error: 'The AI assistant is temporarily unavailable.',
      details: err.message,
    });
  }
});

export default router;
