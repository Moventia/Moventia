import { Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function MovieCard({ movie, onClick }) {
  const currentYear = new Date().getFullYear();
  const isUpcoming = movie.year > currentYear;

  return (
    <Card
      className="h-full flex flex-col overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 group"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative w-full shrink-0">
        <ImageWithFallback 
          src={movie.poster} 
          alt={movie.title} 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded flex items-center gap-1 z-10">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold">{movie.rating}</span>
        </div>
        {isUpcoming && (
          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded font-semibold z-10">
            Upcoming
          </div>
        )}
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold mb-1 line-clamp-1 text-foreground group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <p className="text-sm text-muted-foreground">{movie.year}</p>
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {(movie.genre || []).slice(0, 2).map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
