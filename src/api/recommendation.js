import tmdbAPI from '../api/tmdb';

export const getCustomRecommendations = async () => {
  try {
    // Get rated movies from localStorage
    const ratedMovies = JSON.parse(localStorage.getItem('movieRatings')) || [];
    if (ratedMovies.length === 0) {
      return { movieRatings: [], relatedMovies: [], user: null }; // Return empty arrays and null user if no rated movies
    }

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user')) || null;

    // Fetch details of rated movies and include the user's rating
    const movieRatingsWithDetails = await Promise.all(
      ratedMovies.map(async movie => {
        const res = await tmdbAPI.get(`/movie/${movie.id}`);
        return {
          userRating: movie.rating,  // Assuming movie.rating is the user's rating
          movieInfo: res.data,       // Movie details fetched from TMDB API
        };
      })
    );

    // Extract unique genre IDs from rated movies to find related movies
    const genreIds = [...new Set(movieRatingsWithDetails.flatMap(movie => movie.movieInfo.genres.map(g => g.id)))];

    // Fetch movies from the related genres
    const genreMovies = await Promise.all(
      genreIds.map(async genreId => {
        const res = await tmdbAPI.get('/discover/movie', { params: { with_genres: genreId } });
        return res.data.results;
      })
    );

    // Flatten movie list and remove duplicates
    const allGenreMovies = [...new Set(genreMovies.flat())];

    // Prepare related movies
    const relatedMovies = allGenreMovies

    // Return the results including rated movies, related movies, and user information
    return {
      movieRatings: movieRatingsWithDetails, // User's rated movies with details
      relatedMovies: relatedMovies,          // Movies related to the user's ratings
      user: user,                            // User object from localStorage
    };
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    return { movieRatings: [], relatedMovies: [], user: null }; // Return empty arrays and null user on error
  }
};
