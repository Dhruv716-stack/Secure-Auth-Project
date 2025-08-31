import pickle

with open('feature_cols.pkl', 'rb') as f:
    feature_cols = pickle.load(f)
print('Feature columns:', feature_cols) 