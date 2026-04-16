# Moventia

Moventia is a full-stack movie discovery, review, and social platform.

It combines live movie data from TMDB with social features so users can:
- browse trending, popular, top-rated, and now-playing movies,
- write and engage with reviews,
- follow other users,
- manage favorites,
- receive notifications,
- and chat with an AI movie assistant for recommendations.

## Features

### Movie Discovery
- Browse and search movies using TMDB data.
- View detailed movie pages with synopsis, ratings, genre, cast, and director.
- Explore categories such as trending, top-rated, and now playing.

### Reviews and Community
- Create movie reviews.
- Like and comment on reviews.
- Maintain a personalized feed.
- Follow/unfollow users and view followers/following lists.

### AI Chatbot
- Auth-protected movie chatbot endpoint.
- Uses Groq + TMDB context for movie-focused recommendations and answers.



## Project Structure

```text
Moventia/
├─ backend/
│  ├─ config/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  ├─ uploads/
│  ├─ index.js
│  └─ seed.js
├─ frontend/
│  ├─ src/
│  ├─ index.html
│  └─ vite.config.js
└─ README.md
```

## Getting Started

### 1. Prerequisites
- Node.js 18+ (recommended)
- MongoDB (local or cloud)
- TMDB API key
- Groq API key (required for chatbot)

### 2. Clone and Install

```bash
git clone https://github.com/Moventia/Moventia.git
cd Moventia

cd backend
npm install

cd ../frontend
npm install
```

### 3. Environment Variables

Create `backend/.env` with values like:

```env
PORT=8080
MONGO_URI=mongodb://127.0.0.1:27017/moventia
JWT_SECRET=your_strong_jwt_secret
TMDB_API_KEY=your_tmdb_key
GROQ_API_KEY=your_groq_key
```

### 4. Run the App

One command (recommended):

```bash
./start.sh
```

If needed (first time only):

```bash
chmod +x start.sh
```

Manual method:

Run backend:

```bash
cd backend
npm run dev
```

Run frontend in another terminal:

```bash
cd frontend
npm run dev
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`
