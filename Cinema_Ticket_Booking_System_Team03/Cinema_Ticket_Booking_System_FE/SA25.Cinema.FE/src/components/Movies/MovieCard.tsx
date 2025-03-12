import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { Movie } from '../../types';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      <Link to={`/movies/${movie.id}`}>
        <div className="relative pb-[150%]">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-0 right-0 bg-indigo-600 text-white px-2 py-1 m-2 rounded-md flex items-center">
            <Star className="h-4 w-4 mr-1 fill-current" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/movies/${movie.id}`}>
          <h3 className="font-bold text-lg mb-1 hover:text-indigo-600 transition-colors">
            {movie.title}
          </h3>
        </Link>
        
        <div className="flex items-center text-gray-500 mb-2">
          <Clock className="h-4 w-4 mr-1" />
          <span>{movie.duration} min</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {movie.genre.map((genre, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
            >
              {genre}
            </span>
          ))}
        </div>
        
        <Link
          to={`/movies/${movie.id}`}
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default MovieCard;