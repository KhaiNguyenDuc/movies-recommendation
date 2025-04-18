import pickle
from fastapi import FastAPI
from typing import Optional
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import torch
import pickle
from model_DN import DQNetwork, load_model_and_data

# Load links.csv (assumes it's in the same folder)
links = pd.read_csv("links.csv")

# FastAPI app
app = FastAPI()
# Allow requests from React frontend
origins = [
    "http://localhost:3000",  # React frontend origin
    # You can add more allowed origins here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # <- This is important!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Load model and data from pkl file
with open("lightfm_model.pkl", "rb") as f:
    data = pickle.load(f)

# Extract components from the loaded pkl
model = data["model"]
dataset = data["dataset"]
item_features_matrix = data["item_features_matrix"]
movies = data["movies"]
sampled_ratings = data["sampled_ratings"]

# Khởi động backend
model2, data2 = load_model_and_data(DQNetwork, 'model-2.pth', 'data.pkl')
user_info_df = data2['user_info_df']
movie_ids = data2['movie_ids']
num_age_groups = data2['num_age_groups']
num_genders = data2['num_genders']
num_occupations = data2['num_occupations']


# Join function to get TMDb ID based on item_id
def get_tmdb_id(movie_id):
    row = links[links['movieId'] == movie_id]
    if not row.empty:
        return int(row.iloc[0]['tmdbId']) if not pd.isna(row.iloc[0]['tmdbId']) else None
    return None

def recommend_movies(model, user_id, n=10, verbose=True):
    user_id_to_idx = dataset.mapping()[0]
    item_id_to_idx = dataset.mapping()[2]

    if user_id not in user_id_to_idx:
        return {"error": f"User ID {user_id} không tồn tại trong tập dữ liệu!"}

    user_ratings = sampled_ratings[sampled_ratings['user_id'] == user_id]

    if user_ratings.empty:
        print(f"User {user_id} has not rated any movies.")
    else:
        print(f"\nMovies rated by user {user_id}:")
        for _, row in user_ratings.iterrows():
            item_id = row['item_id']
            rating = row['rating']
            movie_info = movies[movies['item_id'] == item_id].iloc[0]
            print(f"- {movie_info['title']} ({int(movie_info['year']) if not pd.isna(movie_info['year']) else 'Unknown'}) | Rating: {rating}")


    user_idx = user_id_to_idx[user_id]
    item_ids = list(item_id_to_idx.keys())
    rated_items = sampled_ratings[sampled_ratings['user_id'] == user_id]['item_id'].values
    unrated_items = [item for item in item_ids if item not in rated_items]
    item_indices = [item_id_to_idx[item] for item in unrated_items]

    scores = model.predict(user_idx, item_indices, item_features=item_features_matrix)

    min_score, max_score = scores.min(), scores.max()
    if max_score > min_score:
        normalized_scores = 1 + 4 * (scores - min_score) / (max_score - min_score)
    else:
        normalized_scores = [3.0] * len(scores)

    item_scores = list(zip(unrated_items, scores, normalized_scores))
    item_scores.sort(key=lambda x: x[1], reverse=True)
    top_n = item_scores[:n]

    recommendations = []
    for item_id, original_score, normalized_score in top_n:
        movie_info = movies[movies['item_id'] == item_id].iloc[0]
        genres = movie_info['genres'].split('|')

        recommendations.append({
            'item_id': int(item_id),
            'title': movie_info['title'],
            'genres': ", ".join(genres),
            'year': int(movie_info['year']) if not pd.isna(movie_info['year']) else 'Unknown',
            'original_score': float(original_score),
            'score': float(normalized_score),
            'tmdbId': get_tmdb_id(int(item_id))  # <- Add TMDb ID here
        })

    print(f"\nMovies recommend for user {user_id}:")
    if isinstance(recommendations, dict) and "error" in recommendations:
        print(recommendations["error"])
    else:
        for movie in recommendations:
            print(f"- {movie['title']} ({movie['year']}) | Genres: {movie['genres']} | Predicted Score: {movie['score']:.2f}")
    return recommendations

# FastAPI endpoint to recommend movies
@app.get("/recommend/{user_id}")
def recommend_endpoint(user_id: int, top_n: Optional[int] = 10):
    result = recommend_movies(model, user_id, n=top_n, verbose=False)
    return result

# Preprocessing step: prepare this once at the start of your code (before training or using the model)
unique_occupations = sorted(user_info_df['occupation'].unique())
occupation2idx = {occ: i for i, occ in enumerate(unique_occupations)}
num_occupations = len(occupation2idx)

# You can also update the user_info_df with indexed occupations for quicker lookup
user_info_df['occupation_idx'] = user_info_df['occupation'].map(occupation2idx)

def encode_state(user_id, movie_id):
    user_row = user_info_df[user_info_df['user_id'] == user_id].iloc[0]
    
    age = user_row['age_group']
    gender = user_row['gender']
    occupation = user_row['occupation_idx']  # Use mapped index
    
    feature = torch.zeros(num_age_groups + num_genders + num_occupations)
    
    feature[age] = 1
    feature[num_age_groups + gender] = 1
    feature[num_age_groups + num_genders + occupation] = 1
    
    return feature

def recommend_movie_for_user(user_id):
    model2.eval()
    best_q = -float('inf')
    best_movie = None

    with torch.no_grad():
        for idx, movie_id in enumerate(movie_ids):
            # build state
            state = encode_state(user_id, movie_id).unsqueeze(0)  # [1, state_dim]

            # get Q(s,·) vector
            q_vect = model2(state)                            # [1, action_dim]

            # pick the Q-value corresponding to this movie’s index
            q_value = q_vect[0, idx]                             # scalar

            if q_value.item() > best_q:
                best_q = q_value.item()
                best_movie = movie_id

    return best_movie


@app.get("/dqn_recommend/{user_id}")
def dqn_recommend_endpoint(user_id: int):
    recommended_movie_id = recommend_movie_for_user(user_id)
    print(f"\nBest movie recommend for user {user_id}: {int(recommended_movie_id)}")
    if recommended_movie_id is None:
        return {"error": "No recommendation found for this user."}

    return {
        "item_id": int(recommended_movie_id),
        'tmdbId': get_tmdb_id(int(recommended_movie_id))  # <- Add TMDb ID here
    }

