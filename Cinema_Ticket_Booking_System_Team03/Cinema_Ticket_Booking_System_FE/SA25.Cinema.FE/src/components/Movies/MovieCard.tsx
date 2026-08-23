import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Star, Play, Ticket, X } from 'lucide-react';

interface Movie {
  movie_ID: number;
  movie_Name: string;
  release_Date: string;
  end_Date: string;
  production_Company: string;
  director: string;
  cast: string;
  duration: number;
  genre: string;
  rating: string;
  language: string;
  country: string;
  synopsis: string;
  poster_URL: string;
  trailer_Link: string;
  status: string;
}

interface MovieCardProps {
  movie: Movie;
}

// Age rating color mapping
const getAgeRatingStyle = (rating: string) => {
  const r = rating?.toUpperCase() || '';
  if (r === 'G' || r === 'P') return { label: 'P', cls: 'bg-green-500 text-white' };
  if (r.includes('PG-13') || r.includes('C13')) return { label: 'C13', cls: 'bg-yellow-500 text-black' };
  if (r.includes('C16') || r.includes('TV-14')) return { label: 'C16', cls: 'bg-orange-500 text-white' };
  if (r.includes('C18') || r.includes('R') || r.includes('NC-17')) return { label: 'C18', cls: 'bg-red-600 text-white' };
  return { label: 'PG', cls: 'bg-blue-500 text-white' };
};

// Extract YouTube video ID
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/);
  return match ? match[1] : null;
};

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const ageRating = getAgeRatingStyle(movie.rating);
  const ytId = getYouTubeId(movie.trailer_Link);
  const genres = movie.genre?.split(',').slice(0, 2) || [];
  const isNowShowing = movie.status === 'Now Showing';

  const fallbackPoster = `https://image.tmdb.org/t/p/w400${
    movie.movie_Name.includes('Avengers') ? '/or06FN3Dka5tukK1e9sl16pB3iy.jpg'
    : movie.movie_Name.includes('Spider') ? '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg'
    : movie.movie_Name.includes('Inception') ? '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'
    : movie.movie_Name.includes('Interstellar') ? '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
    : '/qJ2tW6WMUDux911r6m7haRef0WH.jpg'
  }`;

  return (
    <>
      <div className="group relative flex flex-col bg-[#161D2F] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1">
        {/* Poster */}
        <Link to={`/movie/${movie.movie_ID}`} className="block relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
          <img
            src={imgError ? fallbackPoster : (movie.poster_URL || fallbackPoster)}
            alt={movie.movie_Name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161D2F] via-transparent to-transparent opacity-60" />

          {/* Status badge */}
          <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-md ${
            isNowShowing
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/40'
              : 'bg-amber-500/90 text-black'
          }`}>
            {isNowShowing ? '● ĐANG CHIẾU' : '⏳ SẮP CHIẾU'}
          </div>

          {/* Age rating */}
          <div className={`absolute top-2 right-2 text-xs font-black px-2 py-1 rounded-md ${ageRating.cls}`}>
            {ageRating.label}
          </div>

          {/* Rating badge */}
          {movie.rating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-amber-400 px-2 py-1 rounded-md text-xs font-bold border border-amber-400/20">
              <Star className="h-3 w-3 fill-current" />
              <span>{movie.rating}</span>
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-gray-300 px-2 py-1 rounded-md text-xs border border-white/10">
            <Clock className="h-3 w-3" />
            <span>{movie.duration}p</span>
          </div>

          {/* Hover play overlay */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            {ytId && (
              <button
                onClick={(e) => { e.preventDefault(); setIsTrailerOpen(true); }}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all"
              >
                <Play className="h-6 w-6 text-white fill-current ml-0.5" />
              </button>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400"
                >
                  {g.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <Link to={`/movie/${movie.movie_ID}`}>
            <h3 className="font-bold text-white text-base leading-tight line-clamp-2 hover:text-red-400 transition-colors">
              {movie.movie_Name}
            </h3>
          </Link>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto pt-2">
            {isNowShowing ? (
              <button
                onClick={() => navigate(`/movie/${movie.movie_ID}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
              >
                <Ticket className="h-3.5 w-3.5" />
                Đặt vé
              </button>
            ) : (
              <button
                onClick={() => navigate(`/movie/${movie.movie_ID}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium rounded-xl transition-all"
              >
                Xem chi tiết
              </button>
            )}
            {ytId && (
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 text-gray-300 hover:text-white rounded-xl transition-all flex-shrink-0"
                title="Xem trailer"
              >
                <Play className="h-4 w-4 fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {isTrailerOpen && ytId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setIsTrailerOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                title={movie.movie_Name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MovieCard;
