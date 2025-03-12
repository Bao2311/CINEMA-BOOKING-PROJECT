import React, { useState, useEffect } from 'react';
import { Movie } from '../../types';
import { X } from 'lucide-react';

interface MovieFormProps {
  movie?: Movie;
  onSubmit: (movie: Omit<Movie, 'id'>) => void;
  onCancel: () => void;
}

const MovieForm: React.FC<MovieFormProps> = ({ movie, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(movie?.title || '');
  const [description, setDescription] = useState(movie?.description || '');
  const [duration, setDuration] = useState(movie?.duration.toString() || '');
  const [genre, setGenre] = useState<string[]>(movie?.genre || []);
  const [genreInput, setGenreInput] = useState('');
  const [releaseDate, setReleaseDate] = useState(movie?.releaseDate || '');
  const [posterUrl, setPosterUrl] = useState(movie?.posterUrl || '');
  const [trailerUrl, setTrailerUrl] = useState(movie?.trailerUrl || '');
  const [rating, setRating] = useState(movie?.rating.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!duration.trim()) newErrors.duration = 'Duration is required';
    if (isNaN(Number(duration))) newErrors.duration = 'Duration must be a number';
    if (genre.length === 0) newErrors.genre = 'At least one genre is required';
    if (!releaseDate) newErrors.releaseDate = 'Release date is required';
    if (!posterUrl.trim()) newErrors.posterUrl = 'Poster URL is required';
    if (!trailerUrl.trim()) newErrors.trailerUrl = 'Trailer URL is required';
    if (!rating.trim()) newErrors.rating = 'Rating is required';
    if (isNaN(Number(rating))) newErrors.rating = 'Rating must be a number';
    if (Number(rating) < 0 || Number(rating) > 10) newErrors.rating = 'Rating must be between 0 and 10';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSubmit({
      title,
      description,
      duration: Number(duration),
      genre,
      releaseDate,
      posterUrl,
      trailerUrl,
      rating: Number(rating),
    });
  };

  const handleAddGenre = () => {
    if (genreInput.trim() && !genre.includes(genreInput.trim())) {
      setGenre([...genre, genreInput.trim()]);
      setGenreInput('');
    }
  };

  const handleRemoveGenre = (index: number) => {
    setGenre(genre.filter((_, i) => i !== index));
  };

  const handleGenreKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddGenre();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.duration ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
        </div>

        <div>
          <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-1">
            Release Date
          </label>
          <input
            type="date"
            id="releaseDate"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.releaseDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.releaseDate && <p className="mt-1 text-sm text-red-600">{errors.releaseDate}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
          Genres
        </label>
        <div className="flex">
          <input
            type="text"
            id="genre"
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={handleGenreKeyDown}
            className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.genre ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Add a genre"
          />
          <button
            type="button"
            onClick={handleAddGenre}
            className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
        {errors.genre && <p className="mt-1 text-sm text-red-600">{errors.genre}</p>}
        
        <div className="flex flex-wrap gap-2 mt-2">
          {genre.map((g, index) => (
            <div
              key={index}
              className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center"
            >
              <span>{g}</span>
              <button
                type="button"
                onClick={() => handleRemoveGenre(index)}
                className="ml-1 text-indigo-600 hover:text-indigo-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="posterUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Poster URL
        </label>
        <input
          type="url"
          id="posterUrl"
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.posterUrl ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.posterUrl && <p className="mt-1 text-sm text-red-600">{errors.posterUrl}</p>}
      </div>

      <div>
        <label htmlFor="trailerUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Trailer URL
        </label>
        <input
          type="url"
          id="trailerUrl"
          value={trailerUrl}
          onChange={(e) => setTrailerUrl(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.trailerUrl ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.trailerUrl && <p className="mt-1 text-sm text-red-600">{errors.trailerUrl}</p>}
      </div>

      <div>
        <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
          Rating (0-10)
        </label>
        <input
          type="number"
          id="rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          min="0"
          max="10"
          step="0.1"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.rating ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          {movie ? 'Update Movie' : 'Add Movie'}
        </button>
      </div>
    </form>
  );
};

export default MovieForm;