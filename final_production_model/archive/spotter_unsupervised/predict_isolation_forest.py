"""
Live prediction path for the unsupervised "spotter" (Isolation Forest).

This is the first real serving script for the spotter -- until now it only
had a training script (train_isolation_forest.py) and an offline grading
script (evaluate_isolation_forest.py). This mirrors predict_v2.py's
structure for the judge model, applying the SAME correctness requirements:
  1. Imputation BEFORE feature engineering, using the values saved during
     training (iso_imputation_values.pkl) -- not recomputed here, so a
     missing field is filled in exactly the way training assumed it would
     be, not some different guess invented at serving time.
  2. The exact same engineer_features() used during training (imported
     directly from train_isolation_forest.py, not re-typed here, so the
     two can never silently drift apart).
  3. Same categorical-encoding logic (unseen categories map to 'unknown',
     matching how training handled it).
"""
import pickle
import pandas as pd
import numpy as np

from train_isolation_forest import engineer_features

MODEL_DIR = '.'

with open(f'{MODEL_DIR}/isolation_forest.pkl', 'rb') as f:
    iso_model = pickle.load(f)
with open(f'{MODEL_DIR}/iso_scaler.pkl', 'rb') as f:
    iso_scaler = pickle.load(f)
with open(f'{MODEL_DIR}/iso_label_encoders.pkl', 'rb') as f:
    iso_label_encoders = pickle.load(f)
with open(f'{MODEL_DIR}/iso_feature_cols.pkl', 'rb') as f:
    iso_feature_cols = pickle.load(f)
with open(f'{MODEL_DIR}/iso_imputation_values.pkl', 'rb') as f:
    iso_imputation_values = pickle.load(f)


def preprocess_input(input_dict: dict):
    df = pd.DataFrame([input_dict])
    for col in ['user_id', 'session_id', 'persona', 'label']:
        if col in df.columns:
            df = df.drop(columns=[col])
    if 'transaction_date' in df.columns:
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])

    # Impute missing RAW fields first, using training-time values -- must
    # happen before engineer_features(), since derived features (like
    # clicks_per_sec) divide by raw fields and would propagate a NaN/crash
    # if a raw field were left empty.
    for col, val in iso_imputation_values.items():
        if col not in df.columns or pd.isnull(df.at[0, col]):
            df[col] = val

    df = engineer_features(df)

    for col, le in iso_label_encoders.items():
        if col in df.columns:
            df[col] = df[col].astype(str).apply(lambda x: x if x in le.classes_ else 'unknown')
            df[col] = le.transform(df[col])

    for col in iso_feature_cols:
        if col not in df.columns:
            df[col] = 0

    X = df[iso_feature_cols]
    X_scaled = iso_scaler.transform(X)
    return X_scaled


def anomaly_score(X_scaled) -> float:
    """0-1 'unusualness' score, higher = more anomalous -- same direction
    and convention as the judge model's anomaly_score, so the two combine
    cleanly at the decision layer."""
    raw = iso_model.decision_function(X_scaled)  # higher = more normal
    return float(1 / (1 + np.exp(10 * raw[0])))


def predict(input_dict: dict) -> dict:
    X_scaled = preprocess_input(input_dict)
    score = anomaly_score(X_scaled)
    flagged = bool(iso_model.predict(X_scaled)[0] == -1)  # contamination-based cutoff
    return {
        'spotter_anomaly_score': score,
        'spotter_flagged': flagged,
    }


if __name__ == '__main__':
    import sys
    import json
    if len(sys.argv) == 2 and sys.argv[1].endswith('.json'):
        with open(sys.argv[1], 'r') as f:
            input_dict = json.load(f)
        result = predict(input_dict)
        print(json.dumps(result, indent=2))
    else:
        print('Usage: python predict_isolation_forest.py input.json')
