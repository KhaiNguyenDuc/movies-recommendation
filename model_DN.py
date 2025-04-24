import torch
import torch.nn as nn
import torch.optim as optim
import pickle
import numpy as np

class DQNetwork(nn.Module):
    def __init__(self, state_dim, hidden_dim, action_dim):
        super(DQNetwork, self).__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)  # <-- BatchNorm layer 1
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.bn2 = nn.BatchNorm1d(hidden_dim)  # <-- BatchNorm layer 2
        self.fc3 = nn.Linear(hidden_dim, action_dim)

    def forward(self, state):
        x = torch.relu(self.bn1(self.fc1(state)))
        x = torch.relu(self.bn2(self.fc2(x)))
        return self.fc3(x)





def load_model_and_data(model_class, path_model, path_data):
    with open(path_data, 'rb') as f:
        data = pickle.load(f)

    input_dim = data['num_age_groups'] + data['num_genders'] + data['num_occupations'] + len(data['genre_names'])  # should be 45!
    print(f"Input dim: {input_dim}, Expected: 45")
    action_dim = len(data['movie_ids'])
    model = DQNetwork(input_dim, 128, action_dim)
    state_dict = torch.load(path_model, map_location='cpu')
    model.train()  # optional but safer before loading BatchNorm weights
    missing, unexpected = model.load_state_dict(state_dict, strict=False)
    print("Missing keys:", missing)
    print("Unexpected keys:", unexpected)
    model.eval()   # set to eval after loading weights'
    return model, data

