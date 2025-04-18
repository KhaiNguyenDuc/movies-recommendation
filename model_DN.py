import torch
import torch.nn as nn
import torch.optim as optim
import pickle
import numpy as np

class DQNetwork(nn.Module):
    def __init__(self, state_dim, hidden_dim, action_dim):
        super(DQNetwork, self).__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, action_dim)   # ← use action_dim here

    def forward(self, state):
        x = torch.relu(self.fc1(state))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)  # returns [batch_size, action_dim]


def load_model_and_data(model_class, path_model, path_data):
    with open(path_data, 'rb') as f:
        data = pickle.load(f)

    input_dim = data['num_age_groups'] + data['num_genders'] + data['num_occupations']
    action_dim = len(data['movie_ids'])            # ← total number of movies
    model = model_class(input_dim, 128, action_dim)
    model.load_state_dict(torch.load(path_model, map_location='cpu'))
    model.eval()
    return model, data
