import { db } from "../firebase";  // Import Firestore instance
import { doc, getDoc, setDoc } from "firebase/firestore";
import tmdbAPI from "../api/tmdb";

export const getCustomRecommendations = async () => {
  try {
    // Get user from localStorage (or fetch from Firebase Auth if implemented)
    const user = JSON.parse(localStorage.getItem("user")) || null;
    if (!user || !user.email) {
      console.error("User is not logged in. Cannot fetch ratings.");
      return { movieRatings: [], relatedMovies: [], user: null };
    }

    const customerId = user.email; // Use user email as customer ID

    // **Fetch rated movies from Firestore**
    const ratingsRef = doc(db, "movieRatings", customerId);
    const ratingsSnap = await getDoc(ratingsRef);

    if (!ratingsSnap.exists()) {
      console.log("No ratings found in Firestore.");
      return { movieRatings: [], relatedMovies: [], user };
    }

    const ratedMovies = ratingsSnap.data().movieRatings || []; // Ensure we get an array

    if (ratedMovies.length === 0) {
      return { movieRatings: [], relatedMovies: [], user };
    }

    // Fetch details of rated movies
    const movieRatingsWithDetails = await Promise.all(
      ratedMovies.map(async (movie) => {
        const res = await tmdbAPI.get(`/movie/${movie.id}`);
        return {
          userRating: movie.rating,  // User's rating from Firestore
          movieInfo: res.data,       // Movie details from TMDB API
        };
      })
    );

    // Extract unique genre IDs from rated movies
    const genreIds = [...new Set(movieRatingsWithDetails.flatMap(movie => movie.movieInfo.genres.map(g => g.id)))];

    // Fetch related movies by genre
    const genreMovies = await Promise.all(
      genreIds.map(async (genreId) => {
        const res = await tmdbAPI.get("/discover/movie", { params: { with_genres: genreId } });
        return res.data.results;
      })
    );

    // Flatten and remove duplicates
    const relatedMovies = [...new Set(genreMovies.flat())];

    // **Save Recommendations to Firestore**
    const recommendationsRef = doc(db, "Recommendations", customerId);
    await setDoc(recommendationsRef, { relatedMovies }, { merge: true });

    console.log("Recommendations saved to Firestore for user:", customerId);

    return {
      movieRatings: movieRatingsWithDetails,
      relatedMovies,
      user,
    };
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    return { movieRatings: [], relatedMovies: [], user: null };
  }
};
