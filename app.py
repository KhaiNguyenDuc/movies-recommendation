import pickle
from fastapi import FastAPI
from typing import Optional
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import torch
import pickle
from model_DN import DQNetwork, load_model_and_data
from flask import Flask
import numpy as np

# Load links.csv (assumes it's in the same folder)
links = pd.read_csv("links.csv")
app2 = Flask(__name__)

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
    movie_ratings = []
   
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

# Load model and data
model2, data2 = load_model_and_data(DQNetwork, 'model1.pth', 'data1.pkl')
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# Retrieve necessary data
user_info_df = data2['user_info_df']
movie_embedding_dict = data2['movie_embedding_dict']
movie_ids = data2['movie_ids']
movie_ids = movie_ids.tolist()
user_ids = data2['user_ids']
movies_df = data2["movies_df"]
ratings_df = data2["ratings_df"]
genre_names = data2['genre_names']

def encode_state(user_id, movie_id):
    """Tạo state từ user_id và movie_id"""
    # Lấy đặc trưng user
    user_row = user_info_df[user_info_df['user_id'] == user_id].iloc[0]
    user_feature = np.zeros(data2['num_age_groups'] + data2['num_genders'] + data2['num_occupations'], dtype=np.float32)

    # One-hot encode user features
    age = user_row['age_group']
    gender = user_row['gender']
    occupation = user_row['occupation']

    if age < data2['num_age_groups']:
        user_feature[age] = 1
    if gender < data2['num_genders']:
        user_feature[data2['num_age_groups'] + gender] = 1
    if occupation < data2['num_occupations']:
        user_feature[data2['num_age_groups'] + data2['num_genders'] + occupation] = 1

    # Lấy đặc trưng phim
    movie_feature = movie_embedding_dict.get(movie_id, np.zeros(len(genre_names)))

    # Kết hợp đặc trưng
    state = np.concatenate([user_feature, movie_feature])
    return state

def recommend_movie_for_user(user_id: int, top_k: Optional[int] = 10):
    """API endpoint để recommend phim"""
    if user_id is None:
        return jsonify({'error': 'Missing user_id'}), 400

    # Lấy danh sách phim đã xem (từ database thực tế)
    user_history = ratings_df.groupby('user_id')['movie_id'].apply(list).to_dict()
    user_ratings_print = ratings_df[ratings_df["user_id"] == user_id]
    print(f"\Movie rated by user {user_id}:")
    if user_ratings_print.empty:
        print("  (no history)")
    else:
        print(user_ratings_print)

    watched_movies = user_history.get(user_id, [])

    # Lọc phim chưa xem
    unwatched_movies = [m for m in movie_ids if m not in watched_movies]
    candidate_movies = unwatched_movies if unwatched_movies else movie_ids

    q_values = []
    with torch.no_grad():
        for movie_id in candidate_movies:
            state = encode_state(user_id, movie_id)
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(device)
            all_q = model2(state_tensor)             # [1, num_movies]
            idx = movie_ids.index(movie_id)          # position in output vector
            q_val = all_q[0, idx].item()
            q_values.append((movie_id, q_val))

    # Sắp xếp theo Q-value giảm dần và lấy top-k
    q_values.sort(key=lambda x: x[1], reverse=True)
    top_movies = [movie_id for movie_id, _ in q_values[:top_k]]

    # Lấy thông tin chi tiết phim từ database
    movie_details = []
    for movie_id in top_movies:
        movie_info = get_movie_details(movie_id)
        movie_details.append(movie_info)

    print(f"\nMovies recommend for user {user_id}:")
    if isinstance(movie_details, dict) and "error" in movie_details:
        print(movie_details["error"])
    else:
        for movie in movie_details:
            print(f"- {movie['title']} | Genres: {movie['genres']}")

    top_ids = [mid for mid, _ in q_values[:top_k]]
    return top_ids

def get_movie_details(movie_id):
    """Lấy thông tin chi tiết của phim từ database"""
    # Trong thực tế, đây sẽ là một query database
    movie_row = movies_df[movies_df['movie_id'] == movie_id].iloc[0]
    return {
        'movie_id': int(movie_id),
        'title': movie_row['movie_title'] if isinstance(movie_row['movie_title'], str) else movie_row['movie_title'].decode('utf-8'),
        'genres': movie_row['genres'],
        'year': int(movie_row['movie_year']) if 'movie_year' in movie_row else None
    }


@app.get("/recommend_2/{user_id}")
def recommend_movie_endpoint_2(user_id: int, top_k: Optional[int] = 10):
    # Get a list of top_k movie_ids
    top_movie_ids = recommend_movie_for_user(user_id, top_k)
    if not top_movie_ids:
        print("No recommendation found for this user.")
    
    # Build a list of result objects
    results = []
    for movie_id in top_movie_ids:
        results.append({
            "item_id": int(movie_id),
            "tmdbId": get_tmdb_id(int(movie_id))
        })
    
    return results
