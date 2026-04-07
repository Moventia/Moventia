// Mock data for the movie review website

export const currentUser = {
  id: 'current-user',
  username: 'cinephile_alex',
  name: 'Alex Johnson',
  avatar: 'https://images.unsplash.com/photo-1539605480396-a61f99da1041?w=200',
  bio: 'Movie enthusiast | Reviewing films since 2020 | Sci-fi and thriller lover 🎬',
  followers: 1243,
  following: 456,
  reviewCount: 87
};

export const mockUsers = [
  {
    id: '1',
    username: 'movie_buff_sam',
    name: 'Sam Martinez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    bio: 'Horror movie aficionado | Podcast host',
    followers: 2341,
    following: 234,
    reviewCount: 156,
    isFollowing: true
  },
  {
    id: '2',
    username: 'film_critic_jane',
    name: 'Jane Cooper',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    bio: 'Professional film critic | Writing about cinema for 10+ years',
    followers: 8921,
    following: 123,
    reviewCount: 432,
    isFollowing: true
  },
  {
    id: '3',
    username: 'indie_film_mike',
    name: 'Mike Chen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    bio: 'Independent cinema lover | Film festival regular',
    followers: 567,
    following: 789,
    reviewCount: 93,
    isFollowing: false
  }
];

export const mockMovies = [
  {
    id: '1',
    title: 'Stellar Odyssey',
    year: 2024,
    genre: ['Sci-Fi', 'Adventure'],
    poster: 'https://images.unsplash.com/photo-1653045474061-075ba29db54f?w=400',
    rating: 4.5,
    reviewCount: 2341,
    synopsis: 'A thrilling journey through space as a crew discovers an ancient alien civilization that holds the key to humanity\'s future.',
    director: 'Emma Rodriguez',
    cast: ['John Blake', 'Sarah Kim', 'Marcus Johnson'],
    duration: '2h 28m'
  },
  {
    id: '2',
    title: 'Midnight Shadows',
    year: 2025,
    genre: ['Horror', 'Thriller'],
    poster: 'https://images.unsplash.com/photo-1630338679229-99fb150fbf88?w=400',
    rating: 4.2,
    reviewCount: 1876,
    synopsis: 'A family moves into an old mansion only to discover they are not alone. Dark secrets from the past come back to haunt them.',
    director: 'David Chen',
    cast: ['Emily Watson', 'Tom Hardy', 'Lisa Anderson'],
    duration: '1h 52m'
  },
  {
    id: '3',
    title: 'Hearts in Paris',
    year: 2024,
    genre: ['Romance', 'Drama'],
    poster: 'https://images.unsplash.com/photo-1708787788824-07d6d97b0111?w=400',
    rating: 3.8,
    reviewCount: 987,
    synopsis: 'Two strangers meet by chance in Paris and embark on a whirlwind romance that changes their lives forever.',
    director: 'Sophie Laurent',
    cast: ['Pierre Dubois', 'Claire Martin', 'Jacques Bernard'],
    duration: '1h 45m'
  },
  {
    id: '4',
    title: 'The Last Stand',
    year: 2025,
    genre: ['Action', 'Thriller'],
    poster: 'https://images.unsplash.com/photo-1765510296004-614b6cc204da?w=400',
    rating: 4.6,
    reviewCount: 3421,
    synopsis: 'When a rogue agent threatens global security, an elite team must stop them before it\'s too late in this explosive thriller.',
    director: 'Michael Bay',
    cast: ['Chris Evans', 'Zoe Saldana', 'Idris Elba'],
    duration: '2h 15m'
  },
  {
    id: '5',
    title: 'Laugh Out Loud',
    year: 2024,
    genre: ['Comedy'],
    poster: 'https://images.unsplash.com/photo-1762417421419-f5f8ecfe9136?w=400',
    rating: 3.9,
    reviewCount: 756,
    synopsis: 'A struggling comedian gets one last chance to make it big, but everything that can go wrong does in this hilarious comedy.',
    director: 'Judd Apatow',
    cast: ['Kevin Hart', 'Amy Poehler', 'Seth Rogen'],
    duration: '1h 38m'
  },
  {
    id: '6',
    title: 'Broken Dreams',
    year: 2025,
    genre: ['Drama'],
    poster: 'https://images.unsplash.com/photo-1647962982511-f120db3d63c8?w=400',
    rating: 4.3,
    reviewCount: 1234,
    synopsis: 'A powerful drama about family, loss, and redemption as three siblings reunite after their father\'s unexpected death.',
    director: 'Greta Gerwig',
    cast: ['Meryl Streep', 'Timothée Chalamet', 'Saoirse Ronan'],
    duration: '2h 5m'
  }
];

export const mockReviews = [
  {
    id: '1',
    movieId: '1',
    movieTitle: 'Stellar Odyssey',
    moviePoster: 'https://images.unsplash.com/photo-1653045474061-075ba29db54f?w=200',
    userId: '1',
    username: 'movie_buff_sam',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    rating: 5,
    title: 'A Masterpiece of Modern Sci-Fi',
    content: 'Stellar Odyssey takes the sci-fi genre to new heights with stunning visuals and a compelling narrative. The world-building is exceptional, and the performances are top-notch. Rodriguez has created something truly special here.',
    spoiler: false,
    likes: 234,
    comments: 45,
    createdAt: '2 days ago',
    isLiked: false
  },
  {
    id: '2',
    movieId: '4',
    movieTitle: 'The Last Stand',
    moviePoster: 'https://images.unsplash.com/photo-1765510296004-614b6cc204da?w=200',
    userId: '2',
    username: 'film_critic_jane',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    rating: 4,
    title: 'Non-Stop Action Extravaganza',
    content: 'While the plot might be predictable, The Last Stand delivers exactly what action fans want: incredible set pieces, intense fight choreography, and charismatic performances. Pure entertainment.',
    spoiler: false,
    likes: 567,
    comments: 89,
    createdAt: '1 week ago',
    isLiked: true
  },
  {
    id: '3',
    movieId: '2',
    movieTitle: 'Midnight Shadows',
    moviePoster: 'https://images.unsplash.com/photo-1630338679229-99fb150fbf88?w=200',
    userId: '3',
    username: 'indie_film_mike',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    rating: 4,
    title: 'Genuinely Terrifying',
    content: 'Midnight Shadows doesn\'t rely on cheap jump scares. Instead, it builds a sense of dread that stays with you long after the credits roll. The atmosphere is incredible.',
    spoiler: false,
    likes: 432,
    comments: 67,
    createdAt: '3 days ago',
    isLiked: false
  }
];

export const mockNotifications = [
  {
    id: '1',
    type: 'follow',
    fromUser: 'indie_film_mike',
    fromAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    message: 'started following you',
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: '2',
    type: 'like',
    fromUser: 'movie_buff_sam',
    fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    message: 'liked your review of "Stellar Odyssey"',
    timestamp: '5 hours ago',
    read: false
  },
  {
    id: '3',
    type: 'comment',
    fromUser: 'film_critic_jane',
    fromAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    message: 'commented on your review of "The Last Stand"',
    timestamp: '1 day ago',
    read: true
  },
  {
    id: '4',
    type: 'review',
    fromUser: 'movie_buff_sam',
    fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    message: 'reviewed "Midnight Shadows"',
    timestamp: '2 days ago',
    read: true
  }
];
