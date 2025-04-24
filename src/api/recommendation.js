import backend from "../api/backend";
import tmdbAPI from "../api/tmdb"; // assuming you already have this configured

export async function getDQNRecommendation(userId, top_k = 10) {
  try {
    // 1) Fetch the array of recommendation objects
    const { data: recList } = await backend.get(
      `/recommend_2/${userId}?top_k=${top_k}`
    );

    if (!Array.isArray(recList)) {
      console.warn("DQN returned unexpected payload:", recList);
      return [];
    }

    // 2) For each recommendation, fetch the TMDb details in parallel
    const detailPromises = recList.map(({ tmdbId }) =>
      tmdbAPI
        .get(`/movie/${tmdbId}`)
        .then(({ data }) => ({ ...data, recommendedBy: "DQN" }))
        .catch((err) => {
          console.error(`Failed to fetch TMDb for ID ${tmdbId}:`, err);
          return null;
        })
    );

    // 3) Wait for all to resolve, filter out any failures
    const detailedMovies = (await Promise.all(detailPromises)).filter(
      Boolean
    );

    return detailedMovies;
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
