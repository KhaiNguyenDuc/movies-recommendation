import backend from "../api/backend";
import tmdbAPI from "../api/tmdb"; // assuming you already have this configured


/**
 * Fetch single movie recommendation from DQN model for a given user.
 *
 * @param {number} userId
 * @returns {Promise<Object[]>} – Array of enriched TMDb movie data (empty if none)
 */
export async function getDQNRecommendation(userId) {
  try {
    const { data: rec } = await backend.get(`/dqn_recommend/${userId}`);

    // If the backend signals an error or there's no tmdbId, return an empty array
    if (!rec || rec.error || !rec.tmdbId) {
      console.warn("DQN returned no recommendation or missing TMDb ID.", rec?.error);
      return [];
    }

    // Otherwise fetch the full details and wrap them in an array
    const { data: tmdbMovie } = await tmdbAPI.get(`/movie/${rec.tmdbId}`);
    return [
      {
        ...tmdbMovie,
        recommendedBy: "DQN",
      }
    ];

  } catch (err) {
    console.error(`Failed to fetch DQN recommendation for user ${userId}:`, err);
    return [];
  }
}

/**
 * Fetch top‐N movie recommendations for a given user and enrich with TMDB data.
 *
 * @param {number} userId
 * @param {number} [nRecs=10]
 * @returns {Promise<Array>} – enriched movie data
 */
export const getCustomRecommendations = async (userId, nRecs = 10) => {
  try {
    const { data: recommendations } = await backend.get(`/recommend/${userId}?top_n=${nRecs}`);
    console.log(`Recommendations for user ${userId}:`, recommendations);

    const enriched = await Promise.all(
      recommendations.map(async (item) => {
        try {
          const { data: tmdbMovie } = await tmdbAPI.get(`/movie/${item.tmdbId}`);
          return {
            ...tmdbMovie,       // full TMDB movie data
            customScore: item.score,      // custom backend score
            originalScore: item.original_score,
            genresText: item.genres,      // genres as text from backend
            year: item.year,              // backend metadata
          };
        } catch (err) {
          console.error(`Failed to fetch TMDB data for tmdbId ${item.tmdbId}`, err);
          return null;
        }
      })
    );

    // Remove any null (failed requests)
    return enriched.filter(Boolean);

  } catch (err) {
    console.error("Failed to fetch recommendations:", err);
    throw err;
  }
};
